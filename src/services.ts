import ora from "ora";
import pRetry from "p-retry";
import { z } from "zod";
import {
  type PartialService,
  APISchemas,
  partialServiceSchema,
  FullService,
  fullServiceSchema,
} from "./schemas";
import { Files } from "./consts";
import chalk from "chalk";
import LogUtils from "./utils/log";

export async function downloadServiceList() {
  const spinner = ora("Downloading service list from ToS;DR...").start();

  const serviceList: PartialService[] = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    await pRetry(
      async (attemptCount) => {
        const response = await fetch(
          `https://api.tosdr.org/service/v2/?page=${currentPage}`,
        );
        const json = await response.json();
        const parseResult = await APISchemas.listServices.safeParseAsync(json);

        if (parseResult.success) {
          serviceList.push(...parseResult.data.parameters.services);
          totalPages = parseResult.data.parameters._page.end;
          currentPage++;
          spinner.text = `Downloading service list from ToS;DR (page ${currentPage} of ${totalPages})...`;
        } else if (
          (json as { error_msg?: string }).error_msg ===
          "You are doing this too much!"
        ) {
          spinner.suffixText = chalk.dim(
            `(rate limited in attempt #${attemptCount})`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          spinner.suffixText = "";
          throw new Error("Rate limited");
        } else {
          LogUtils.error(
            `Error downloading service list from ToS;DR (page ${currentPage} of ${totalPages}): ${parseResult.error.message}`,
          );
          throw new Error("Data format is not as expected");
        }
      },
      { retries: 5 },
    );
  }

  spinner.text = "Saving to cache...";
  await Bun.write(Files.cache.serviceList, JSON.stringify(serviceList));
  spinner.succeed(
    `Downloaded service list from ToS;DR (${serviceList.length} services)`,
  );

  return serviceList;
}

export async function getServiceList() {
  try {
    const cache = await Files.cache.serviceList.json<object>();
    const parsed = await z.array(partialServiceSchema).parseAsync(cache);
    return parsed;
  } catch {
    // TODO
  }
  const services = await downloadServiceList();
  return services;
}

export async function appendCache(services: FullService[]) {
  const existingServices = await getDownloadedFullServices();
  const ids = new Set(services.map(({ id }) => id));
  const mergedServices = [
    ...existingServices.filter(({ id }) => !ids.has(id)),
    ...services,
  ];
  await Bun.write(".cache/fullServices.json", JSON.stringify(mergedServices));
  return mergedServices;
}

export async function downloadFullServices(ids: number[], showSpinner = true) {
  const spinner = showSpinner
    ? ora(`Downloading ${ids.length} services from ToS;DR...`).start()
    : null;

  const services: FullService[] = [];
  let count = 0;

  for (const id of ids) {
    await pRetry(
      async (attemptCount) => {
        const response = await fetch(
          `https://api.tosdr.org/service/v2/?id=${id}`,
        );
        const data = await response.json();
        const parseResult = await APISchemas.getService.safeParseAsync(data);

        if (parseResult.success) {
          services.push(parseResult.data.parameters);
          count++;
          if (spinner)
            spinner.text = `Downloading services from ToS;DR (service ${count} of ${ids.length})...`;
        } else if (
          (data as { error_msg?: string }).error_msg ===
          "You are doing this too much!"
        ) {
          if (spinner)
            spinner.suffixText = chalk.dim(
              `(rate limited in attempt #${attemptCount})`,
            );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (spinner) spinner.suffixText = "";
          throw new Error("Rate limited");
        } else {
          LogUtils.error(
            `Error downloading service #${id} from ToS;DR: ${JSON.stringify(data)}`,
          );
          throw new Error("Data format is not as expected");
        }
      },
      { retries: 5 },
    );
  }

  if (spinner) spinner.text = "Saving to cache...";
  await appendCache(services);
  if (spinner)
    spinner.succeed(`Downloaded ${services.length} services from ToS;DR`);

  return services;
}

export async function getDownloadedFullServices() {
  try {
    const cache = await Files.cache.fullServices.json<object>();
    const parsed = await z.array(fullServiceSchema).parseAsync(cache);
    return parsed;
  } catch {
    // TODO
  }
  return [];
}

export async function getFullService(
  service: PartialService | number,
  showSpinner = false,
) {
  const id = typeof service === "number" ? service : service.id;
  const existingServices = await getDownloadedFullServices();
  const existingService = existingServices.find(
    ({ id: existingId }) => id === existingId,
  );
  // eslint-disable-next-line unicorn/no-await-expression-member
  return existingService ?? (await downloadFullServices([id], showSpinner))[0];
}

export async function getFullServices(
  services: (PartialService | number)[],
  showSpinner = true,
) {
  const ids = services.map((service) =>
    typeof service === "number" ? service : service.id,
  );
  const downloadedServices = await getDownloadedFullServices();
  const existingServices = downloadedServices.filter(({ id }) =>
    ids.includes(id),
  );
  const existingIds = new Set(existingServices.map(({ id }) => id));
  const missingIds = ids.filter((id) => !existingIds.has(id));
  if (missingIds.length === 0) return existingServices;
  const missingServices = await downloadFullServices(missingIds, showSpinner);
  return [...existingServices, ...missingServices];
}

export function getServicePointsForDocument(
  service: FullService,
  documentUrl: string,
) {
  return service.points.filter(
    ({ status, source }) => status === "approved" && source === documentUrl,
    // && analysis === "Generated through the annotate view",
  );
}
