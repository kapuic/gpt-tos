import ora from "ora";
import { Files } from "./consts";
import {
  APISchemas,
  PartialService,
  TopDomains,
  topDomainsSchema,
} from "./schemas";

export async function downloadTopDomains() {
  const spinner = ora("Downloading top domains from Open PageRank...").start();

  const response = await fetch(
    "https://www.domcop.com/service/getTopDomains.php?jobId=&sEcho=6&iColumns=4&sColumns=&iDisplayStart=0&iDisplayLength=1000&mDataProp_0=0&mDataProp_1=1&mDataProp_2=2&mDataProp_3=3&sSearch=&bRegex=false&sSearch_0=&bRegex_0=false&bSearchable_0=true&sSearch_1=&bRegex_1=false&bSearchable_1=true&sSearch_2=&bRegex_2=false&bSearchable_2=true&sSearch_3=&bRegex_3=false&bSearchable_3=true&iSortCol_0=0&sSortDir_0=asc&iSortingCols=1&bSortable_0=true&bSortable_1=true&bSortable_2=true&bSortable_3=true",
  );
  const data = await response.json();
  const parsedData = APISchemas.getTopDomains.parse(data);

  const topDomains = parsedData.aaData.map((row) => ({
    rank: Number.parseInt(row[0].replace(",", "")),
    domain: row[1],
    rating: Number.parseInt(row[2].split("<small>")[0]),
  }));

  spinner.text = "Saving to cache...";
  await Bun.write(Files.cache.topDomains, JSON.stringify(topDomains));
  spinner.succeed(
    `Downloaded top domains from Open PageRank (${topDomains.length} domains)`,
  );

  return topDomains;
}

export async function getTopDomains() {
  try {
    const cache = await Files.cache.topDomains.json<object>();
    const parsed = await topDomainsSchema.parseAsync(cache);
    return parsed;
  } catch {
    const domains = await downloadTopDomains();
    return domains;
  }
}

export function getHostnameFromDomain(domain: string) {
  return domain.split(".").slice(-2).join(".");
}

export function getServiceByDomain(services: PartialService[], domain: string) {
  domain = getHostnameFromDomain(domain);
  return services.find(({ urls }) =>
    urls.some((url) => getHostnameFromDomain(url) === domain),
  );
}

export function getDomainsSample(
  services: PartialService[],
  topDomains: TopDomains,
  size: number,
) {
  const domains = Object.values(topDomains);
  const sample: string[] = [];
  while (sample.length < size) {
    const index = Math.floor(Math.random() * domains.length);
    const domain = getHostnameFromDomain(domains[index].domain);
    if (sample.includes(domain)) continue;
    if (!getServiceByDomain(services, domain)) continue;
    sample.push(domain);
    domains.splice(index, 1);
  }
  return sample;
}
