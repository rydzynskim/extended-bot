import mysql from 'mysql2';
import { BaseExtension } from '../base-extension.js';
import { IMethod } from '../types.js';
import { deferPromise } from '../../helpers/promise.js';

export class Mysql extends BaseExtension {
  /**
   * Executes the given sql on the given database
   *
   * @returns the result of the query as a string
   */
  // eslint-disable-next-line class-methods-use-this
  public async executeSql(input: {
    database: string;
    sql: string;
  }): Promise<string> {
    const connection = mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: process.env.MYSQL_PASSWORD,
      database: input.database,
    });

    const executionPromise = deferPromise<string>();
    connection.connect((err) => {
      if (err) {
        return executionPromise.reject(err);
      }

      connection.query(input.sql, (error, results) => {
        connection.end();
        if (error) {
          return executionPromise.reject(error);
        }

        return executionPromise.resolve(JSON.stringify(results));
      });

      return void 0;
    });
    const res = await executionPromise.promise;

    return res;
  }

  public getExtensionInfo(): IMethod[] {
    return [
      {
        description: 'Execute sql on a local mysql database.',
        name: 'executeSql',
        args: [
          {
            description: 'The database to run the sql on.',
            name: 'database',
            type: { kind: 'string' },
            required: true,
          },
          {
            description: 'The sql code to run.',
            name: 'sql',
            type: { kind: 'string' },
            required: true,
          },
        ],
        functionReference: this.executeSql,
      },
    ];
  }
}
