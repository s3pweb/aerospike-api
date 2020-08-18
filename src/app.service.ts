import { BadRequestException, Injectable } from '@nestjs/common';
import * as Aerospike from 'aerospike';
import { LoggingService } from './utils/logging/logging.service';
import { Stream } from 'stream';

const defaults = {
  socketTimeout: 5000,
  totalTimeout: 10000,
  maxRetries: 5,
};

@Injectable()
export class AppService {
  protected log: any;
  protected client;

  constructor(
    logger: LoggingService,
  ) {
    this.log = logger.getLogger('AerospikeService');
  }

  async connect(url: string, uuid: string): Promise<any> {
    const result = {
      success: false,
      message: '',
    };

    const params = {
      hosts: url,
      policies: {
        read: new Aerospike.ReadPolicy(defaults),
        write: new Aerospike.WritePolicy(defaults),
        remove: new Aerospike.RemovePolicy(defaults),
      },
    };

    try {
      this.client = await Aerospike.connect(params);
    } catch (err) {
      this.log.warn({ uuid, err }, 'Error while connecting to aerospike server.');
      throw new BadRequestException(err.message);
    }

    this.client.on('event', (event) => {
      this.log.debug({ uuid }, `Aerospike event: ${JSON.stringify(event)}, IsConnected: ${this.client.isConnected()}`);
    });

    this.client.on('disconnected', () => {
      this.log.error({ uuid }, 'Disconnected from Aerospike');
      throw new Error('Disconnected from Aerospike');
    });

    this.log.trace({ uuid }, 'Aerospike connected');

    result.success = true;
    result.message = 'Aerospike connected';

    return result;
  }

  async getNamespaces(): Promise<any> {
    const namespaces = [];

    const infoAny = await this.client.infoAny('namespaces');
    const split = infoAny.split('\t');

    if (split[1] && split[1].length) {
      const data = split[1];
      const splitData = data.split('\n');

      if (splitData.length) {
        for (const item of splitData) {
          if (item.length) {
            namespaces.push(item);
          }
        }
      }
    }

    return namespaces;
  }

  async getSets(namespace: string): Promise<any> {
    const sets = [];

    const infoAny = await this.client.infoAny(`sets/${namespace}`);
    const split = infoAny.split('\t');

    if (split[1] && split[1].length) {
      const data = split[1];
      const splitData = data.split('\n');

      if (splitData.length) {
        for (const item of splitData) {
          if (item.length) {
            const splitItem = item.split(':');

            if (splitItem[1] && splitItem[1].length) {
              const set = splitItem[1].replace('set=', '');
              sets.push(set);
            }
          }
        }
      }
    }

    return sets;
  }

  /**
   * Get all keys from Aerospike records to make tasks
   */
  async getRecordKeys(namespace: string, collection: string): Promise<string[]> {
    const scan = this.client.scan(namespace, collection);
    const stream = scan.foreach();

    return this.scanRecords(stream);
  }

  /**
   * Return the record keys from the stream
   * @param stream scan stream
   */
  scanRecords(stream: Stream): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const keys: string[] = [];

      stream.on('data', (record) => {
        if (record && record.key) {
          keys.push(record.key);
        } else {
          this.log.error('Record without key ? ', record);
        }
      });

      stream.on('error', (error) => {
        this.log.error('Error while scanning: %s [%d]', error.message, error.code);
        reject(error);
      });

      stream.on('end', () => {
        resolve(keys);
      });
    });
  }
}
