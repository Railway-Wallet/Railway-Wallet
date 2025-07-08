import { isDefined } from '@railgun-community/shared-models';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import cn from 'classnames';
import html2canvas from 'html2canvas';
import FingerprintJS, {
  GetResult as FingerprintResult,
} from '@fingerprintjs/fingerprintjs';
import { usePersistedState } from '@hooks/usePersistedState';
import { Spinner } from '@views/components/loading/Spinner/Spinner';
import CryptoJS from 'crypto-js';
import aes from 'crypto-js/aes';
import styles from './styles.module.css';

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
  const chkHash = sha512.toLowerCase();
  const refBlur = useRef<HTMLDivElement>(null);

  const [fingerprint, setFingerprint] = useState<Optional<FingerprintResult>>();
  const [decryptedHash, setDecryptedHash] = useState('');
  const [renderChild, setRenderChild] = useState(true);
  const [password, setPassword] = useState('');

  const [cipher, setCipher] = usePersistedState('cipher', '');
  useMemo(() => ({ cipher, setCipher }), [cipher, setCipher]);

  const handleSubmit = () => {
    const hash = CryptoJS.SHA512(password).toString();

    if (hash === chkHash && fingerprint) {
      setCipher(
        aes
          .encrypt(JSON.stringify({ password }), fingerprint.visitorId)
          .toString(),
      );
      setDecryptedHash(hash);
    } else {
      setCipher('');
      setPassword('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  useEffect(() => {
    const getFingerprint = async () => {
      const fpi = await FingerprintJS.load();
      const result = await fpi.get();
      let d;

      try {
        d = aes.decrypt(cipher, result.visitorId).toString(CryptoJS.enc.Utf8);
      } catch (e) {
        d = '';
      }

      if (d) {
        const hash = CryptoJS.SHA512(JSON.parse(d).password).toString();
        setDecryptedHash(hash);
      }

      setFingerprint(result);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getFingerprint();
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

  const isSuccessView = isDefined(fingerprint) && decryptedHash === chkHash;
  const isLoginView = isDefined(fingerprint) && decryptedHash !== chkHash;
  const isLoadingView = !isDefined(fingerprint);

  return isSuccessView ? (
    <div>{children}</div>
  ) : (
    <div>
      {isLoadingView && <Spinner className={styles.spinner} />}
      {isLoginView && (
        <div>
          <div className={styles.inputContainer}>
            <form>
              <input
                autoComplete="off"
                value={password}
                type="password"
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.input}
              />
            </form>
          </div>
          <div
            ref={refBlur}
            className={cn({ [styles.blurClass]: blur })}
            style={{
              filter: `${blur && 'blur(10px)'}`,
              overflow: 'hidden',
            }}
          >
            {blur && renderChild && children}
          </div>
        </div>
      )}
    </div>
  );
};
