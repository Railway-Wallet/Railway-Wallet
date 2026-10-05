const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.platform !== 'darwin') {
  process.exit(0);
}

const projectRoot = path.resolve(__dirname, '..');
const source = path.join(
  projectRoot,
  'electron',
  'macos',
  'RailwayBiometricKeychain.swift'
);
const outputDirectory = path.join(projectRoot, 'dist', 'native');
const output = path.join(outputDirectory, 'RailwayBiometricKeychain');
const architectures = ['arm64', 'x86_64'];
const architectureOutputs = architectures.map(architecture =>
  path.join(outputDirectory, `RailwayBiometricKeychain-${architecture}`)
);

fs.mkdirSync(outputDirectory, { recursive: true });

architectureOutputs.forEach((architectureOutput, index) => {
  execFileSync(
    'xcrun',
    [
      'swiftc',
      '-O',
      '-whole-module-optimization',
      '-target',
      `${architectures[index]}-apple-macosx10.15`,
      '-framework',
      'LocalAuthentication',
      '-framework',
      'Security',
      source,
      '-o',
      architectureOutput,
    ],
    { stdio: 'inherit' }
  );
});

execFileSync(
  'xcrun',
  ['lipo', '-create', ...architectureOutputs, '-output', output],
  { stdio: 'inherit' }
);

fs.chmodSync(output, 0o755);
architectureOutputs.forEach(architectureOutput =>
  fs.rmSync(architectureOutput)
);
