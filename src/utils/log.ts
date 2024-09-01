import boxen from "boxen";
import chalk from "chalk";
import { MultiBar } from "cli-progress";
import { isError } from "lodash";

namespace LogUtils {
  let indent = 0;
  let multiBar: MultiBar | null = null;

  export function applyIndent(modifier = 1): typeof LogUtils {
    indent += modifier;
    return LogUtils;
  }

  export function setMultiBar(bar: MultiBar | null): typeof LogUtils {
    multiBar = bar;
    return LogUtils;
  }

  function write(message: string, prefix?: string) {
    (multiBar ? multiBar.log.bind(multiBar) : console.log)(
      `${
        prefix
          ? message
              .split("\n")
              .map((line) => `${prefix}${line}`)
              .join("\n")
          : message
      }${multiBar ? "\n" : ""}`,
    );
  }

  export function log(...message: string[]): typeof LogUtils {
    write(message.join("\n"), `${"  ".repeat(indent)}${chalk.blue`➤`} `);
    return LogUtils;
  }

  export function done(...message: string[]): typeof LogUtils {
    write(message.join("\n"), `${"  ".repeat(indent)}${chalk.green`✔`} `);
    return LogUtils;
  }

  export function warn(...message: string[]): typeof LogUtils {
    write(message.join("\n"), `${"  ".repeat(indent)}${chalk.yellow`!`} `);
    return LogUtils;
  }

  export function error(...message: (string | Error)[]): typeof LogUtils {
    for (const m of message) {
      if (isError(m))
        write(
          boxen(
            `${chalk.red.bold(`✖ ${m.name}`)}
${m.message}`,
            {
              borderColor: "redBright",
              borderStyle: "round",
              padding: { left: 1, right: 1 },
            },
          ),
        );
      else write(m, `${"  ".repeat(indent)}${chalk.red`✖`} `);
    }
    return LogUtils;
  }

  export function alert(...message: string[]): typeof LogUtils {
    write(
      boxen(
        chalk.yellow(
          message
            .join("\n")
            .split("\n")
            .map((line) => ` ${line} `)
            .join("\n"),
        ),
        {
          borderColor: "yellow",
          borderStyle: "round",
          padding: { left: 1, right: 1 },
        },
      ),
    );
    return LogUtils;
  }
}

export default LogUtils;
