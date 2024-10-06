import { isDefined } from "@railgun-community/shared-models";
import psl from "psl";

const extractHostname = (url: string) => {
  let hostname;
  if (url.indexOf("//") > -1) {
    hostname = url.split("/")[2];
  } else {
    hostname = url.split("/")[0];
  }
  hostname = hostname.split(":")[0];
  hostname = hostname.split("?")[0];
  return hostname;
};

export const domainFromURL = (url: string) => {
  try {
    const parsedUrl = psl.parse(extractHostname(url)) as psl.ParsedDomain;
    if (!isDefined(parsedUrl.domain)) {
      return url;
    }
    if (!isDefined(parsedUrl.subdomain) || parsedUrl.subdomain === "www") {
      return parsedUrl.domain;
    }
    return `${parsedUrl.subdomain.replace(/^www\./, "")}.${parsedUrl.domain}`;
  } catch (e) {
    return url;
  }
};
