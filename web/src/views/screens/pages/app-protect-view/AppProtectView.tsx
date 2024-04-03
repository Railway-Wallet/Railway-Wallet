import { isDefined } from '@railgun-community/shared-models';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import FingerprintJS, {
  GetResult as FingerprintResult,
} from '@fingerprintjs/fingerprintjs';
import { usePersistedState } from '@hooks/usePersistedState';
import CryptoJS from 'crypto-js';
import aes from 'crypto-js/aes';
import cssStyles from './styles.module.css';

type AppProtectViewProps = {
  sha512: string;
  blur?: boolean;
  children: React.ReactNode;
};

export const AppProtectView: React.FC<AppProtectViewProps> = ({
  sha512,
  blur = false,
  children,
}) => {
  const styles = {
    input: {},
    button: {},
    header: {},
    wrapper: {},
  };

  const chkHash = sha512.toLowerCase();
  const [fp, setFP] = useState<Optional<FingerprintResult>>();
  const [decryptedHash, setDecryptedHash] = useState('');
  const [pass, setPass] = useState('');

  const [cipher, setCipher] = usePersistedState('cipher', '');
  useMemo(() => ({ cipher, setCipher }), [cipher, setCipher]);

  const refBlur = useRef<HTMLDivElement>(null);
  const [renderChild, setRenderChild] = useState(true);

  const handleSubmit = () => {
    const hash = CryptoJS.SHA512(pass).toString();

    if (hash === chkHash && fp) {
      setCipher(aes.encrypt(JSON.stringify({ pass }), fp.visitorId).toString());
      setDecryptedHash(hash);
    } else {
      setCipher('');
      setPass('');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async function getFingerprint() {
      const fpi = await FingerprintJS.load();
      const result = await fpi.get();
      let d;
      try {
        d = aes.decrypt(cipher, result.visitorId).toString(CryptoJS.enc.Utf8);
      } catch (e) {
        d = '';
      }

      if (d) {
        const hash = CryptoJS.SHA512(JSON.parse(d).pass).toString();
        setDecryptedHash(hash);
      }

      setFP(result);
    })();
  }, [cipher]);

  useEffect(() => {
    if (blur && isDefined(refBlur.current) && renderChild) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      html2canvas(refBlur.current, { useCORS: true }).then(canvas => {
        // @ts-ignore
        refBlur.current?.appendChild(canvas);
        setRenderChild(false);
      });
    }
  });

  if (isDefined(fp) && decryptedHash === chkHash) {
    return <div>{children}</div>;
  }

  return (
    (<div>
      {!isDefined(fp) && (
        <div className={cssStyles.skChase}>
          <div className={cssStyles.skChaseDot} />
          <div className={cssStyles.skChaseDot} />
          <div className={cssStyles.skChaseDot} />
          <div className={cssStyles.skChaseDot} />
          <div className={cssStyles.skChaseDot} />
        </div>
      )}
      {isDefined(fp) && decryptedHash !== chkHash && (
        <div>
          <div style={styles.wrapper} className={cssStyles.box}>
            {}
            <div>
              <input
                value={pass}
                onChange={e => setPass(e.target.value)}
                type="password"
                onKeyDown={handleKeyDown}
                placeholder=""
                style={styles.input}
              />
            </div>
            {}
          </div>
          <div
            ref={refBlur}
            className={blur ? cssStyles.blurClass : ''}
            style={{
              filter: `${blur && 'blur(10px)'}`,
              overflow: 'hidden',
            }}
          >
            {blur && renderChild && children}
          </div>
        </div>
      )}
    </div>)
  );
};
