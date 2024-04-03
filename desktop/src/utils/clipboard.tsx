import { isDefined } from '@railgun-community/shared-models';

export const copyToClipboard = async (val: string) => {
  if (isDefined(navigator.clipboard) && window.isSecureContext) {
    await navigator.clipboard.writeText(val);
  } else {
    const el = document.createElement('textarea');
    el.value = val;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
};
