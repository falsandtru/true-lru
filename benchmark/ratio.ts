import { TLRU } from '../index';
import { LRU } from 'spica/lru';
import { SLRU } from 'spica/slru';
import { cofetch } from 'spica/cofetch';
import { memoize } from 'spica/memoize';
import { wait } from 'spica/timer';

describe('Benchmark: Package', async function () {
  await wait(3000);

  class Stats {
    total = 0;
    lru = 0;
    sru = 0;
    trc = 0;
    clear() {
      this.total = 0;
      this.lru = 0;
      this.sru = 0;
      this.trc = 0;
    }
  }
  async function run(label: string, source: string, capacity: number) {
    const keys = await parse(source);
    const lru = new LRU<number, 1>(capacity);
    const sru = new SLRU<number, 1>(capacity);
    const trc = new TLRU<number, 1>(capacity);
    const stats = new Stats();
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      ++stats.total;
      stats.lru += lru.get(key) ?? (lru.set(key, 1), 0);
      stats.sru += sru.get(key) ?? (sru.set(key, 1), 0);
      stats.trc += trc.get(key) ?? (trc.set(key, 1), 0);
    }
    print(`${label} ${capacity.toLocaleString('en')}`, stats);
  }
  const parse = memoize(async function (source: string): Promise<readonly number[]> {
    const { responseText: data } = await cofetch(source);
    const acc = [];
    for (let i = 0; i < data.length; i = data.indexOf('\n', i + 1) + 1 || data.length) {
      const line = data.slice(i, data.indexOf('\n', i)).trim();
      const fields = line.includes(',')
        ? line.split(',').slice(1, 4)
        : line.split(/\s/).slice(0, 2);
      if (fields.length === 0) break;
      const key = +fields[0];
      const cnt = line.includes(',')
        ? fields[2].toLowerCase() === 'r' ? Math.ceil(+fields[1] / 512) : 0
        : +fields[1] || 1;
      for (let i = 0; i < cnt; ++i) {
        acc.push(key + i);
      }
    }
    return acc;
  });
  function print(label: string, stats: Stats): void {
    console.log(label);
    console.log('LRU  hit ratio', `${format(stats.lru * 100 / stats.total, 2)}%`);
    console.log('SLRU hit ratio', `${format(stats.sru * 100 / stats.total, 2)}%`);
    console.log('TLRU hit ratio', `${format(stats.trc * 100 / stats.total, 2)}%`);
    console.log('TLRU - LRU  hit ratio delta', `${format((stats.trc - stats.lru) * 100 / stats.total, 2)}%`);
    console.log('TLRU - SLRU hit ratio delta', `${format((stats.trc - stats.sru) * 100 / stats.total, 2)}%`);
    console.log('');
  }
  function format(n: number, u: number): string {
    return `${n}`.replace(/(\.\d+)?$/, s => u ? `.${s.slice(1, 1 + u).padEnd(u, '0')}` : '');
  }

  for (const capacity of [100, 250, 500, 750, 1000, 1250]) {
    await run(`LOOP`, '/base/benchmark/trace/loop.trc', capacity);
  }

  for (const capacity of [250, 500, 750, 1000, 1250, 1500, 1750, 2000]) {
    await run(`GLI`, '/base/benchmark/trace/gli.trc', capacity);
  }

  for (const capacity of [250, 500, 750, 1000, 1250, 1500, 1750, 2000]) {
    await run(`OLTP`, '/base/benchmark/trace/oltp.arc', capacity);
  }

  for (const capacity of [2500, 5000, 7500, 10000, 12500, 15000, 17500, 20000]) {
    await run(`F1`, '/base/benchmark/trace/Financial1.spc', capacity);
  }

  for (const capacity of [1e5, 2e5, 3e5, 4e5, 5e5, 6e5, 7e5, 8e5]) {
    await run(`S3`, '/base/benchmark/trace/s3.arc', capacity);
  }

  for (const capacity of [1e6, 2e6, 3e6, 4e6, 5e6, 6e6, 7e6, 8e6]) {
    await run(`WS1`, '/base/benchmark/trace/WebSearch1.spc', capacity);
  }

  for (const capacity of [1e6, 2e6, 3e6, 4e6, 5e6, 6e6, 7e6, 8e6]) {
    await run(`DS1`, '/base/benchmark/trace/ds1.arc', capacity);
  }

});
