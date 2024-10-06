#!/usr/bin/env node

const p = require('util').promisify;
const ora = require('ora');
const { chunksToLinesAsync, chomp } = require('@rauschma/stringio');
const spawn = require('child_process').spawn;
const loading = ora('...').start();
const verbose = !!process.argv.includes('--verbose');
const targetPlatform = process.argv.includes('--ios') ? 'ios' : 'android';

async function echoReadable(readable) {
  for await (const line of chunksToLinesAsync(readable)) {
    console.log(chomp(line));
  }
}

async function readableToArray(readable) {
  const arr = [];
  for await (const line of chunksToLinesAsync(readable)) {
    arr.push(chomp(line));
  }
  return arr;
}

async function runAndReport(label, task) {
  const now = Date.now();
  loading.spinner = 'star';
  loading.start(label);
  loading.stopAndPersist();
  let stderr = [];
  if (verbose) {
    await Promise.all([echoReadable(task.stdout), echoReadable(task.stderr)]);
  } else {
    stderr = await readableToArray(task.stderr);
  }
  try {
    await p(task.on.bind(task))('close');
  } catch (code) {
    loading.fail();
    if (verbose) console.error('Exited with code ' + code);
    for (const line of stderr) console.log(line);
    process.exit(code);
  }
  const duration = Date.now() - now;
  const durationLabel =
    duration < 1000
      ? duration + ' milliseconds'
      : duration < 60000
      ? (duration * 0.001).toFixed(1) + ' seconds'
      : ((duration * 0.001) / 60).toFixed(1) + ' minutes';
  loading.succeed(
    `${label}${duration >= 1000 ? ' (' + durationLabel + ')' : ''}`,
  );
}

(async function () {
  await runAndReport(
    'Move nodejs-src to nodejs-assets',
    spawn(`./tools/nodejs/move-nodejs-project.sh`),
  );

  if (targetPlatform === 'ios') {
    await runAndReport(
      'Install backend node modules',
      spawn('yarn', ['--ignore-optional'], {
        cwd: `./nodejs-assets/nodejs-project`,
        env: {
          PLATFORM_NAME: 'iphoneos',
          DONT_COMPILE_NODE_ADDON: [
            '@railgun-community/curve25519-scalarmult-rsjs',
            '@railgun-community/poseidon-hash-rsjs',
          ].join(','),
          ...process.env,
        },
      }),
    );
  } else {
    await runAndReport(
      'Install backend node modules',
      spawn('yarn', [], {
        cwd: `./nodejs-assets/nodejs-project`,
        env: {
          DONT_COMPILE_NODE_ADDON: [
            '@railgun-community/curve25519-scalarmult-rsjs',
            '@railgun-community/poseidon-hash-rsjs',
          ].join(','),
          ...process.env,
        },
      }),
    );
  }

  await runAndReport(
    'Move files and build TypeScript',
    spawn('yarn', ['build'], {
      cwd: `./nodejs-assets/nodejs-project`,
    }),
  );

  if (targetPlatform === 'android' || targetPlatform === 'ios') {
    await runAndReport(
      'Pre-remove files not necessary for Android nor iOS',
      spawn(`./tools/nodejs/remove-unused-files.sh`),
    );
  }

  if (targetPlatform === 'android') {
    await runAndReport(
      'Copy pre-builds for leveldown',
      spawn('./tools/android/copy-leveldown-node-prebuilds.sh'),
    );
  }

  if (targetPlatform === 'android') {
    await runAndReport(
      'Build native modules for all Android architectures',
      spawn('./tools/android/build-native-modules.sh'),
    );
  }

  await runAndReport(
    'Bundle and minify backend JS into one file',
    spawn(`./tools/nodejs/esbuild-mobile.sh`),
  );

  if (targetPlatform === 'android') {
    await runAndReport(
      'Remove unnecessary files and folders from the Android project',
      spawn(
        'rm',
        [
          '-rf',
          '.eslintrc.js',
          'node_modules',
          'services',
          'src',
          'tools',
          'patches',
          'package-lock.json',
          'package.json',
          'init.js.map',
          'main.js.map',
          'tsconfig.json',
          'yarn.lock',
        ],
        {
          cwd: `./nodejs-assets/nodejs-project`,
        },
      ),
    );
  } else if (targetPlatform === 'ios') {
    await runAndReport(
      'Remove unnecessary files and folders from the iOS project',
      spawn(
        'rm',
        [
          '-rf',
          '.eslintrc.js',
          'services',
          'src',
          'init.js.map',
          'main.js.map',
          'tsconfig.json',
          'yarn.lock',
        ],
        {
          cwd: `./nodejs-assets/nodejs-project`,
        },
      ),
    );
  }
})();
