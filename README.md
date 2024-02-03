# True LRU

![CI](https://github.com/falsandtru/true-lru/workflows/CI/badge.svg)

True LRU.

TLRU and TRC are abbreviations for TrueLRU (spica/tlru).

## Maintenance

The source code is maintained on the next source repository.

https://github.com/falsandtru/spica

## Abstract

LRU and Clock are significantly low performance due to their wrong algorithm based on false recency. True recency outperforms false recency.

There are three kinds of recency relationships between entries, used and used, used and unused, and unused and unused. However, LRU and Clock violate some recency. True LRU outperforms LRU and Clock by observing all recency.

The fundamental error is that new entries are considered most recently used. In fact, they have never been used in the cache. Therefore, new entries must to be added after the entries actually used.

```
Sequence: 1, 2, 3, 3, 2, 4

LRU

  MRU |4 2 3 1| LRU
  Hit |0 1 1 0|
        ^ Violation of the recency between used and unused.

Clock

  N-1 |4 3 2 1| 0
  Hit |0 1 1 0|
          ^ Violation of the recency between used and used.

True LRU

  MRU |2 3 4 1| LRU
  Hit |1 1 0 0|
        ^ ^ ^ Ideal recency.
```

## Efficiency

### Mathematical efficiency

Some different cache algorithms require extra memory space to retain evicted keys.
Linear time complexity indicates the existence of batch processing.
Note that admission algorithm doesn't work without eviction algorithm.

|Algorithm|Type |Time complexity<br>(Worst case)|Space complexity<br>(Extra)|Key size|Data structures|
|:-------:|:---:|:------:|:------:|:---------:|:-----:|
|LRU      |Evict|Constant|Constant|    1x     |1 list |
|SLRU     |Evict|Constant|Constant|    1x     |1 list |
|TLRU     |Evict|Constant|Constant|    1x     |1 list |
|DWC      |Evict|Constant|Constant|    1x     |2 lists|
|ARC      |Evict|Constant|Linear  |    2x     |4 lists|
|LIRS     |Evict|Linear  |Linear  |**3-2500x**|2 lists|
|W-TinyLFU|Admit|Linear  |Linear  |*~1-10x*<br>(8bit * 10N * 4)|1 list<br>4 arrays|

https://github.com/ben-manes/caffeine/wiki/Efficiency<br>
https://github.com/zhongch4g/LIRS2/blob/master/src/replace_lirs_base.cc

### Engineering efficiency

A pointer is 8 bytes, bool and int8 are each 1 byte in C.

#### 8 byte key and value (int64, float64, 8 chars)

Memoize, etc.

|Algorithm|Entry overhead|Key size|Total per entry|Attenuation coefficient|
|:-------:|-------------:|-------:|--------------:|----------------------:|
|LRU      |      16 bytes|      1x|       32 bytes|                100.00%|
|SLRU     |      16 bytes|      1x|       32 bytes|                100.00%|
|TLRU     |      16 bytes|      1x|       32 bytes|                100.00%|
|DWC      |      17 bytes|      1x|       33 bytes|                 96.96%|
|ARC      |      17 bytes|      2x|       58 bytes|                 55.17%|
|(LIRS)   |      33 bytes|      3x|      131 bytes|                 24.42%|
|(LIRS)   |      33 bytes|     10x|      418 bytes|                  7.65%|
|W-TinyLFU|      56 bytes|      1x|       72 bytes|                 44.44%|

#### 32 byte key and 8 byte value (Session ID / ID)

In-memory KVS, etc.

|Algorithm|Entry overhead|Key size|Total per entry|Attenuation coefficient|
|:-------:|-------------:|-------:|--------------:|----------------------:|
|LRU      |      16 bytes|      1x|       56 bytes|                100.00%|
|SLRU     |      16 bytes|      1x|       56 bytes|                100.00%|
|TLRU     |      16 bytes|      1x|       56 bytes|                100.00%|
|DWC      |      17 bytes|      1x|       57 bytes|                 98.24%|
|ARC      |      17 bytes|      2x|       88 bytes|                 63.63%|
|(LIRS)   |      33 bytes|      3x|      203 bytes|                 27.58%|
|(LIRS)   |      33 bytes|     10x|      658 bytes|                  8.51%|
|W-TinyLFU|      56 bytes|      1x|       96 bytes|                 58.33%|

#### 16 byte key and 512 byte value (Domain / DNS packet)

DNS cache server, etc.

|Algorithm|Entry overhead|Key size|Total per entry|Attenuation coefficient|
|:-------:|-------------:|-------:|--------------:|----------------------:|
|LRU      |      16 bytes|      1x|      544 bytes|                100.00%|
|SLRU     |      16 bytes|      1x|      544 bytes|                100.00%|
|TLRU     |      16 bytes|      1x|      544 bytes|                100.00%|
|DWC      |      17 bytes|      1x|      545 bytes|                 99.81%|
|ARC      |      17 bytes|      2x|      578 bytes|                 94.11%|
|(LIRS)   |      33 bytes|      3x|      659 bytes|                 82.54%|
|(LIRS)   |      33 bytes|     10x|    1,002 bytes|                 54.29%|
|W-TinyLFU|      56 bytes|      1x|      584 bytes|                 93.15%|

## Resistance

LIRS's burst resistance means the resistance to continuous cache misses for the last LIR entry or the HIR entries.
TLRU's loop resistance is limited.

|Algorithm|Type |Scan|Loop|Burst|
|:-------:|:---:|:--:|:--:|:---:|
|LRU      |Evict|    |    |  ✓ |
|SLRU     |Evict| ✓ |     | ✓  |
|TLRU     |Evict| ✓ |  ✓ | ✓  |
|DWC      |Evict| ✓ |  ✓ | ✓  |
|ARC      |Evict| ✓ |     | ✓  |
|LIRS     |Evict| ✓ |  ✓ |     |
|W-TinyLFU|Admit| ✓ |  ✓ | ✓  |

## Strategies

- True LRU

## Hit ratio

Note that another cache algorithm sometimes changes the parameter values per workload to get a favorite result as the paper of TinyLFU has changed the window size of W-TinyLFU.

- TLRU's results are measured by the same default parameter values.
- W-TinyLFU's results are the traces of Caffeine.

1. Set the datasets to `./benchmark/trace` (See `./benchmark/ratio.ts`).
2. Run `npm i`.
3. Run `npm run bench`.
4. Click the DEBUG button to open a debug tab.
5. Close the previous tab.
6. Press F12 key to open devtools.
7. Select the console tab.

https://github.com/dgraph-io/benchmarks<br>
https://github.com/ben-manes/caffeine/wiki/Efficiency<br>
https://docs.google.com/spreadsheets/d/1G3deNz1gJCoXBE2IuraUSwLE7H_EMn4Sn2GU0HTpI5Y (https://github.com/jedisct1/rust-arc-cache/issues/1)<br>

<!--
// https://www.chartjs.org/docs/latest/charts/line.html

const config = {
  type: 'line',
  data: data,
  options: {
    scales: {
        y: {
            min: 0,
        },
    },
    plugins: {
      title: {
        display: true,
        text: 'WL'
      }
    }
  },
};
-->

### DS1

<!--
const data = {
  labels: [1e6, 2e6, 3e6, 4e6, 5e6, 6e6, 7e6, 8e6],
  datasets: [
    {
      label: 'Optimal',
      data: [20.19, 31.79, 41.23, 48.09, 54.96, 61.82, 68.69, 74.93],
    },
    {
      label: 'LRU',
      data: [3.09, 10.74, 18.59, 20.24, 21.03, 33.95, 38.9, 43.03],
      borderColor: Utils.color(0),
    },
    {
      label: 'SLRU',
      data: [6.12, 23.31, 36.78, 39.07, 40.66, 49.80, 56.62, 57.56],
      borderColor: Utils.color(4),
    },
    {
      label: 'TLRU',
      data: [7.94, 21.70, 33.46, 39.28, 46.10, 53.28, 60.42, 68.74],
      borderColor: Utils.color(1),
    },
    {
      label: 'DWC',
      data: [14.73, 27.94, 39.46, 44.20, 50.19, 56.83, 62.55, 70.03],
      borderColor: Utils.color(2),
    },
    {
      label: 'ARC',
      data: [6.68, 21.99, 24.16, 29.6, 29.44, 36.04, 47.22, 50.89],
      borderColor: Utils.color(6),
    },
    {
      label: 'LIRS',
      data: [12.98, 26.85, 38.02, 38.14, 38.18, 47.25, 59.89, 71.74],
      borderColor: Utils.color(3),
    },
    {
      label: 'W-TinyLFU',
      data: [14.79, 28.72, 39.82, 45.26, 51.61, 57.82, 64.22, 70.6],
      borderColor: Utils.color(8),
    },
  ]
};
-->

![image](https://github.com/falsandtru/true-lru/assets/3143368/4f77254f-0e1a-467f-a7fb-6af79a21e514)

W-TinyLFU > DWC > (LIRS), TLRU > SLRU > ARC > LRU

- TLRU is a straightforward increase in hit ratio to the end.
- TLRU is beyond the bounds of SLRU.

```
DS1 1,000,000
LRU  hit ratio 3.08%
SLRU hit ratio 6.12%
TLRU hit ratio 7.94%
TLRU - LRU  hit ratio delta 4.86%
TLRU - SLRU hit ratio delta 1.82%

DS1 2,000,000
LRU  hit ratio 10.74%
SLRU hit ratio 23.31%
TLRU hit ratio 21.70%
TLRU - LRU  hit ratio delta 10.96%
TLRU - SLRU hit ratio delta -1.60%

DS1 3,000,000
LRU  hit ratio 18.59%
SLRU hit ratio 36.78%
TLRU hit ratio 33.46%
TLRU - LRU  hit ratio delta 14.87%
TLRU - SLRU hit ratio delta -3.32%

DS1 4,000,000
LRU  hit ratio 20.24%
SLRU hit ratio 39.07%
TLRU hit ratio 39.28%
TLRU - LRU  hit ratio delta 19.03%
TLRU - SLRU hit ratio delta 0.20%

DS1 5,000,000
LRU  hit ratio 21.03%
SLRU hit ratio 40.66%
TLRU hit ratio 46.10%
TLRU - LRU  hit ratio delta 25.07%
TLRU - SLRU hit ratio delta 5.43%

DS1 6,000,000
LRU  hit ratio 33.95%
SLRU hit ratio 49.80%
TLRU hit ratio 53.28%
TLRU - LRU  hit ratio delta 19.32%
TLRU - SLRU hit ratio delta 3.47%

DS1 7,000,000
LRU  hit ratio 38.89%
SLRU hit ratio 56.62%
TLRU hit ratio 60.42%
TLRU - LRU  hit ratio delta 21.52%
TLRU - SLRU hit ratio delta 3.79%

DS1 8,000,000
LRU  hit ratio 43.03%
SLRU hit ratio 57.56%
TLRU hit ratio 68.74%
TLRU - LRU  hit ratio delta 25.71%
TLRU - SLRU hit ratio delta 11.17%
```

### S3

<!--
const data = {
  labels: [1e5, 2e5, 3e5, 4e5, 5e5, 6e5, 7e5, 8e5],
  datasets: [
    {
      label: 'Optimal',
      data: [25.42, 39.79, 50.92, 59.96, 67.09, 72.97, 77.57, 81.27],
    },
    {
      label: 'LRU',
      data: [2.33, 4.63, 7.59, 12.04, 22.77, 34.63, 46.04, 56.6],
      borderColor: Utils.color(0),
    },
    {
      label: 'TLRU',
      data: [3.96, 12.98, 21.55, 30.31, 38.81, 47.22, 55.58, 64.00],
      borderColor: Utils.color(1),
    },
    {
      label: 'SLRU',
      data: [9.91, 17.77, 23.92, 29.36, 37.49, 46.14, 54.93, 63.83],
      borderColor: Utils.color(4),
    },
    {
      label: 'DWC',
      data: [10.14, 20.25, 27.39, 32.69, 38.12, 46.82, 55.71, 64.03],
      borderColor: Utils.color(2),
    },
    {
      label: 'ARC',
      data: [12.18, 21.74, 27.64, 32, 38.44, 46.25, 52.52, 60.14],
      borderColor: Utils.color(6),
    },
    {
      label: 'LIRS',
      data: [12.4, 15.55, 25.08, 34.69, 44.27, 53.15, 60.99, 67.64],
      borderColor: Utils.color(3),
    },
    {
      label: 'W-TinyLFU',
      data: [12.29, 23.55, 33.62, 42.77, 50.96, 58.62, 64.9, 70.26],
      borderColor: Utils.color(8),
    },
  ]
};
-->

![image](https://github.com/falsandtru/true-lru/assets/3143368/caee1d70-a007-4815-966e-5384111a1526)

W-TinyLFU > (LIRS) > DWC > SLRU > TLRU, ARC > LRU

```
S3 100,000
LRU  hit ratio 2.32%
SLRU hit ratio 9.91%
TLRU hit ratio 3.96%
TLRU - LRU  hit ratio delta 1.64%
TLRU - SLRU hit ratio delta -5.94%

S3 200,000
LRU  hit ratio 4.63%
SLRU hit ratio 17.77%
TLRU hit ratio 12.98%
TLRU - LRU  hit ratio delta 8.35%
TLRU - SLRU hit ratio delta -4.78%

S3 300,000
LRU  hit ratio 7.58%
SLRU hit ratio 23.92%
TLRU hit ratio 21.55%
TLRU - LRU  hit ratio delta 13.96%
TLRU - SLRU hit ratio delta -2.36%

S3 400,000
LRU  hit ratio 12.03%
SLRU hit ratio 29.36%
TLRU hit ratio 30.31%
TLRU - LRU  hit ratio delta 18.27%
TLRU - SLRU hit ratio delta 0.95%

S3 500,000
LRU  hit ratio 22.76%
SLRU hit ratio 37.49%
TLRU hit ratio 38.81%
TLRU - LRU  hit ratio delta 16.04%
TLRU - SLRU hit ratio delta 1.31%

S3 600,000
LRU  hit ratio 34.63%
SLRU hit ratio 46.14%
TLRU hit ratio 47.22%
TLRU - LRU  hit ratio delta 12.59%
TLRU - SLRU hit ratio delta 1.07%

S3 700,000
LRU  hit ratio 46.04%
SLRU hit ratio 54.93%
TLRU hit ratio 55.58%
TLRU - LRU  hit ratio delta 9.54%
TLRU - SLRU hit ratio delta 0.65%

S3 800,000
LRU  hit ratio 56.59%
SLRU hit ratio 63.83%
TLRU hit ratio 64.00%
TLRU - LRU  hit ratio delta 7.40%
TLRU - SLRU hit ratio delta 0.16%
```

### OLTP

<!--
const data = {
  labels: [250, 500, 750, 1000, 1250, 1500, 1750, 2000],
  datasets: [
    {
      label: 'Optimal',
      data: [38.47, 46.43, 50.67, 53.62, 55.84, 57.62, 59.13, 60.4],
    },
    {
      label: 'LRU',
      data: [16.47, 23.45, 28.28, 32.83, 36.21, 38.7, 40.79, 42.47],
      borderColor: Utils.color(0),
    },
    {
      label: 'SLRU',
      data: [15.67, 28.51, 33.89, 37.52, 39.88, 41.77, 43.22, 44.45],
      borderColor: Utils.color(4),
    },
    {
      label: 'TLRU',
      data: [16.92, 28.52, 33.50, 37.01, 39.18, 41.19, 42.65, 43.95],
      borderColor: Utils.color(1),
    },
    {
      label: 'DWC',
      data: [19.59, 29.12, 34.90, 37.93, 39.96, 41.79, 43.43, 44.70],
      borderColor: Utils.color(2),
    },
    {
      label: 'ARC',
      data: [21.46, 30.61, 36.04, 39.06, 41.34, 43.15, 44.77, 46.17],
      borderColor: Utils.color(6),
    },
    {
      label: 'LIRS',
      data: [18.27, 26.87, 31.71, 34.82, 37.24, 39.2, 40.79, 42.52],
      borderColor: Utils.color(3),
    },
    {
      label: 'W-TinyLFU',
      data: [22.76, 29.21, 32.97, 35.3, 37.52, 38.99, 40.37, 41.67],
      borderColor: Utils.color(8),
    },
  ]
};
-->

![image](https://github.com/falsandtru/true-lru/assets/3143368/ace6d5b9-d19f-4433-ac6a-22423434e46d)

ARC > DWC > SLRU, TLRU > W-TinyLFU > (LIRS) > LRU

```
OLTP 250
LRU  hit ratio 16.47%
SLRU hit ratio 15.67%
TLRU hit ratio 16.92%
TLRU - LRU  hit ratio delta 0.45%
TLRU - SLRU hit ratio delta 1.25%

OLTP 500
LRU  hit ratio 23.44%
SLRU hit ratio 28.51%
TLRU hit ratio 28.52%
TLRU - LRU  hit ratio delta 5.07%
TLRU - SLRU hit ratio delta 0.00%

OLTP 750
LRU  hit ratio 28.28%
SLRU hit ratio 33.89%
TLRU hit ratio 33.50%
TLRU - LRU  hit ratio delta 5.22%
TLRU - SLRU hit ratio delta -0.38%

OLTP 1,000
LRU  hit ratio 32.83%
SLRU hit ratio 37.52%
TLRU hit ratio 37.01%
TLRU - LRU  hit ratio delta 4.18%
TLRU - SLRU hit ratio delta -0.50%

OLTP 1,250
LRU  hit ratio 36.20%
SLRU hit ratio 39.88%
TLRU hit ratio 39.18%
TLRU - LRU  hit ratio delta 2.97%
TLRU - SLRU hit ratio delta -0.69%

OLTP 1,500
LRU  hit ratio 38.69%
SLRU hit ratio 41.77%
TLRU hit ratio 41.19%
TLRU - LRU  hit ratio delta 2.49%
TLRU - SLRU hit ratio delta -0.57%

OLTP 1,750
LRU  hit ratio 40.78%
SLRU hit ratio 43.22%
TLRU hit ratio 42.65%
TLRU - LRU  hit ratio delta 1.87%
TLRU - SLRU hit ratio delta -0.56%

OLTP 2,000
LRU  hit ratio 42.46%
SLRU hit ratio 44.45%
TLRU hit ratio 43.95%
TLRU - LRU  hit ratio delta 1.48%
TLRU - SLRU hit ratio delta -0.49%
```

### GLI

<!--
const data = {
  labels: [250, 500, 750, 1000, 1250, 1500, 1750, 2000],
  datasets: [
    {
      label: 'Optimal',
      data: [17.71,34.33, 46.13, 53.15, 57.31, 57.96, 57.96, 57.96],
    },
    {
      label: 'LRU',
      data: [0.91, 0.95, 1.15, 11.21, 21.25, 36.56, 45.04, 57.41],
      borderColor: Utils.color(0),
    },
    {
      label: 'SLRU',
      data: [1.39, 1.39, 1.42, 31.34, 41.32, 51.86, 55.06, 57.41],
      borderColor: Utils.color(4),
    },
    {
      label: 'TLRU',
      data: [10.48, 23.88, 36.31, 46.82, 52.04, 53.00, 55.88, 57.96],
      borderColor: Utils.color(1),
    },
    {
      label: 'DWC',
      data: [15.44, 31.53, 41.55, 49.30, 52.42, 53.49, 55.60, 57.96],
      borderColor: Utils.color(2),
    },
    {
      label: 'ARC',
      data: [1.38, 1.38, 1.41, 21.3, 34.43, 50.44, 55.06, 57.41],
      borderColor: Utils.color(6),
    },
    {
      label: 'LIRS',
      data: [15.91, 33.6, 43.61, 50.56, 51.85, 53.55, 55.58, 57.96],
      borderColor: Utils.color(3),
    },
    {
      label: 'W-TinyLFU',
      data: [15.15, 33.08, 43.11, 50.57, 51.87, 53.57, 55.61, 57.96],
      borderColor: Utils.color(8),
    },
  ]
};
-->

![image](https://github.com/falsandtru/true-lru/assets/3143368/3edb7bf4-c2a8-4767-84a8-5179b27b9974)

W-TinyLFU, (LIRS) > DWC > TLRU >> SLRU > ARC > LRU

- TLRU has the loop resistance.

```
GLI 250
LRU  hit ratio 0.93%
SLRU hit ratio 1.39%
TLRU hit ratio 10.48%
TLRU - LRU  hit ratio delta 9.55%
TLRU - SLRU hit ratio delta 9.09%

GLI 500
LRU  hit ratio 0.96%
SLRU hit ratio 1.39%
TLRU hit ratio 23.88%
TLRU - LRU  hit ratio delta 22.92%
TLRU - SLRU hit ratio delta 22.49%

GLI 750
LRU  hit ratio 1.16%
SLRU hit ratio 1.42%
TLRU hit ratio 36.31%
TLRU - LRU  hit ratio delta 35.15%
TLRU - SLRU hit ratio delta 34.89%

GLI 1,000
LRU  hit ratio 11.22%
SLRU hit ratio 31.34%
TLRU hit ratio 46.82%
TLRU - LRU  hit ratio delta 35.60%
TLRU - SLRU hit ratio delta 15.47%

GLI 1,250
LRU  hit ratio 21.25%
SLRU hit ratio 41.32%
TLRU hit ratio 52.04%
TLRU - LRU  hit ratio delta 30.78%
TLRU - SLRU hit ratio delta 10.72%

GLI 1,500
LRU  hit ratio 36.56%
SLRU hit ratio 51.86%
TLRU hit ratio 53.00%
TLRU - LRU  hit ratio delta 16.43%
TLRU - SLRU hit ratio delta 1.14%

GLI 1,750
LRU  hit ratio 45.04%
SLRU hit ratio 55.06%
TLRU hit ratio 55.88%
TLRU - LRU  hit ratio delta 10.83%
TLRU - SLRU hit ratio delta 0.81%

GLI 2,000
LRU  hit ratio 57.41%
SLRU hit ratio 57.41%
TLRU hit ratio 57.96%
TLRU - LRU  hit ratio delta 0.54%
TLRU - SLRU hit ratio delta 0.54%
```

<!--
```
WS1 1,000,000
LRU  hit ratio 2.95%
SLRU hit ratio 6.96%
TLRU hit ratio 6.97%
TLRU - LRU  hit ratio delta 4.02%
TLRU - SLRU hit ratio delta 0.00%

WS1 2,000,000
LRU  hit ratio 6.08%
SLRU hit ratio 12.67%
TLRU hit ratio 17.18%
TLRU - LRU  hit ratio delta 11.09%
TLRU - SLRU hit ratio delta 4.51%

WS1 3,000,000
LRU  hit ratio 9.63%
SLRU hit ratio 17.69%
TLRU hit ratio 26.32%
TLRU - LRU  hit ratio delta 16.69%
TLRU - SLRU hit ratio delta 8.62%

WS1 4,000,000
LRU  hit ratio 21.59%
SLRU hit ratio 27.09%
TLRU hit ratio 35.30%
TLRU - LRU  hit ratio delta 13.70%
TLRU - SLRU hit ratio delta 8.20%

WS1 5,000,000
LRU  hit ratio 33.91%
SLRU hit ratio 37.88%
TLRU hit ratio 43.80%
TLRU - LRU  hit ratio delta 9.88%
TLRU - SLRU hit ratio delta 5.92%

WS1 6,000,000
LRU  hit ratio 45.74%
SLRU hit ratio 48.43%
TLRU hit ratio 51.37%
TLRU - LRU  hit ratio delta 5.63%
TLRU - SLRU hit ratio delta 2.93%

WS1 7,000,000
LRU  hit ratio 54.89%
SLRU hit ratio 56.76%
TLRU hit ratio 57.48%
TLRU - LRU  hit ratio delta 2.59%
TLRU - SLRU hit ratio delta 0.71%

WS1 8,000,000
LRU  hit ratio 61.40%
SLRU hit ratio 62.12%
TLRU hit ratio 62.34%
TLRU - LRU  hit ratio delta 0.93%
TLRU - SLRU hit ratio delta 0.21%

F1 2,500
LRU  hit ratio 27.74%
SLRU hit ratio 28.32%
TLRU hit ratio 27.85%
TLRU - LRU  hit ratio delta 0.11%
TLRU - SLRU hit ratio delta -0.46%

F1 5,000
LRU  hit ratio 30.55%
SLRU hit ratio 32.18%
TLRU hit ratio 31.72%
TLRU - LRU  hit ratio delta 1.16%
TLRU - SLRU hit ratio delta -0.45%

F1 7,500
LRU  hit ratio 32.18%
SLRU hit ratio 34.48%
TLRU hit ratio 34.25%
TLRU - LRU  hit ratio delta 2.07%
TLRU - SLRU hit ratio delta -0.22%

F1 10,000
LRU  hit ratio 33.27%
SLRU hit ratio 35.98%
TLRU hit ratio 35.73%
TLRU - LRU  hit ratio delta 2.45%
TLRU - SLRU hit ratio delta -0.25%

F1 12,500
LRU  hit ratio 34.19%
SLRU hit ratio 37.09%
TLRU hit ratio 36.75%
TLRU - LRU  hit ratio delta 2.56%
TLRU - SLRU hit ratio delta -0.34%

F1 15,000
LRU  hit ratio 34.97%
SLRU hit ratio 37.79%
TLRU hit ratio 37.69%
TLRU - LRU  hit ratio delta 2.72%
TLRU - SLRU hit ratio delta -0.09%

F1 17,500
LRU  hit ratio 35.62%
SLRU hit ratio 38.45%
TLRU hit ratio 38.31%
TLRU - LRU  hit ratio delta 2.69%
TLRU - SLRU hit ratio delta -0.13%

F1 20,000
LRU  hit ratio 36.17%
SLRU hit ratio 39.01%
TLRU hit ratio 38.83%
TLRU - LRU  hit ratio delta 2.66%
TLRU - SLRU hit ratio delta -0.17%
```
-->

## Throughput

No result with 10,000,000 because lru-cache crushes with the next error on the next machine of GitHub Actions.
It is verified that the error was thrown also when benchmarking only lru-cache.
Of course it is verified that DWC works fine under the same condition.

> Error: Uncaught RangeError: Map maximum size exceeded

> System:<br>
  OS: Linux 5.15 Ubuntu 20.04.5 LTS (Focal Fossa)<br>
  CPU: (2) x64 Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz<br>
  Memory: 5.88 GB / 6.78 GB

Clock: spica/clock<br>
ISC: [lru-cache](https://www.npmjs.com/package/lru-cache)<br>
LRU: spica/lru<br>
TRC-C: spica/tlru (spica/trul.clock)<br>
TRC-L: spica/trul.lru<br>
DWC: spica/cache<br>

```
'Clock new x 1,552,561 ops/sec ±1.66% (113 runs sampled)'

'ISC   new x 17,669 ops/sec ±0.83% (122 runs sampled)'

'LRU   new x 26,469,709 ops/sec ±0.93% (121 runs sampled)'

'TRC-C new x 24,865,728 ops/sec ±0.89% (120 runs sampled)'

'TRC-L new x 25,006,319 ops/sec ±0.91% (122 runs sampled)'

'DWC   new x 6,775,282 ops/sec ±0.94% (121 runs sampled)'

'Clock simulation 100 10% x 9,363,738 ops/sec ±0.61% (121 runs sampled)'

'ISC   simulation 100 10% x 9,008,687 ops/sec ±0.80% (121 runs sampled)'

'LRU   simulation 100 10% x 10,725,903 ops/sec ±0.56% (121 runs sampled)'

'TRC-C simulation 100 10% x 10,571,693 ops/sec ±0.64% (122 runs sampled)'

'TRC-L simulation 100 10% x 8,459,734 ops/sec ±0.78% (122 runs sampled)'

'DWC   simulation 100 10% x 6,584,195 ops/sec ±0.42% (123 runs sampled)'

'Clock simulation 1,000 10% x 9,384,521 ops/sec ±0.60% (122 runs sampled)'

'ISC   simulation 1,000 10% x 8,268,271 ops/sec ±0.96% (121 runs sampled)'

'LRU   simulation 1,000 10% x 9,449,176 ops/sec ±0.79% (122 runs sampled)'

'TRC-C simulation 1,000 10% x 9,205,839 ops/sec ±0.45% (121 runs sampled)'

'TRC-L simulation 1,000 10% x 8,005,839 ops/sec ±0.95% (122 runs sampled)'

'DWC   simulation 1,000 10% x 7,532,780 ops/sec ±0.59% (122 runs sampled)'

'Clock simulation 10,000 10% x 9,359,627 ops/sec ±0.79% (122 runs sampled)'

'ISC   simulation 10,000 10% x 6,781,153 ops/sec ±0.72% (121 runs sampled)'

'LRU   simulation 10,000 10% x 8,730,973 ops/sec ±0.72% (120 runs sampled)'

'TRC-C simulation 10,000 10% x 8,021,631 ops/sec ±2.00% (119 runs sampled)'

'TRC-L simulation 10,000 10% x 6,130,857 ops/sec ±2.73% (116 runs sampled)'

'DWC   simulation 10,000 10% x 5,836,941 ops/sec ±1.04% (122 runs sampled)'

'Clock simulation 100,000 10% x 5,590,625 ops/sec ±1.73% (115 runs sampled)'

'ISC   simulation 100,000 10% x 3,278,209 ops/sec ±1.70% (111 runs sampled)'

'LRU   simulation 100,000 10% x 4,765,807 ops/sec ±2.79% (111 runs sampled)'

'TRC-C simulation 100,000 10% x 4,685,016 ops/sec ±2.90% (105 runs sampled)'

'TRC-L simulation 100,000 10% x 4,150,880 ops/sec ±2.95% (111 runs sampled)'

'DWC   simulation 100,000 10% x 3,822,807 ops/sec ±2.51% (108 runs sampled)'

'Clock simulation 1,000,000 10% x 2,280,505 ops/sec ±4.09% (97 runs sampled)'

'ISC   simulation 1,000,000 10% x 1,241,084 ops/sec ±4.17% (101 runs sampled)'

'LRU   simulation 1,000,000 10% x 1,742,529 ops/sec ±3.63% (89 runs sampled)'

'TRC-C simulation 1,000,000 10% x 1,973,322 ops/sec ±5.40% (88 runs sampled)'

'TRC-L simulation 1,000,000 10% x 1,644,990 ops/sec ±4.36% (97 runs sampled)'

'DWC   simulation 1,000,000 10% x 1,951,708 ops/sec ±3.92% (98 runs sampled)'

'Clock simulation 100 90% x 21,254,002 ops/sec ±0.68% (123 runs sampled)'

'ISC   simulation 100 90% x 19,742,448 ops/sec ±0.62% (122 runs sampled)'

'LRU   simulation 100 90% x 18,749,189 ops/sec ±0.68% (122 runs sampled)'

'TRC-C simulation 100 90% x 16,785,649 ops/sec ±0.63% (122 runs sampled)'

'TRC-L simulation 100 90% x 16,148,417 ops/sec ±0.80% (122 runs sampled)'

'DWC   simulation 100 90% x 10,688,142 ops/sec ±0.60% (121 runs sampled)'

'Clock simulation 1,000 90% x 19,744,639 ops/sec ±0.85% (122 runs sampled)'

'ISC   simulation 1,000 90% x 17,049,505 ops/sec ±0.90% (121 runs sampled)'

'LRU   simulation 1,000 90% x 16,579,637 ops/sec ±0.58% (122 runs sampled)'

'TRC-C simulation 1,000 90% x 15,110,520 ops/sec ±0.63% (121 runs sampled)'

'TRC-L simulation 1,000 90% x 14,668,067 ops/sec ±0.55% (122 runs sampled)'

'DWC   simulation 1,000 90% x 8,654,990 ops/sec ±0.44% (123 runs sampled)'

'Clock simulation 10,000 90% x 17,330,494 ops/sec ±1.05% (121 runs sampled)'

'ISC   simulation 10,000 90% x 13,822,754 ops/sec ±0.54% (122 runs sampled)'

'LRU   simulation 10,000 90% x 11,492,835 ops/sec ±1.18% (120 runs sampled)'

'TRC-C simulation 10,000 90% x 10,603,672 ops/sec ±1.00% (121 runs sampled)'

'TRC-L simulation 10,000 90% x 9,814,431 ops/sec ±1.61% (119 runs sampled)'

'DWC   simulation 10,000 90% x 7,915,551 ops/sec ±0.91% (121 runs sampled)'

'Clock simulation 100,000 90% x 10,156,702 ops/sec ±1.60% (113 runs sampled)'

'ISC   simulation 100,000 90% x 7,467,007 ops/sec ±1.15% (117 runs sampled)'

'LRU   simulation 100,000 90% x 7,179,007 ops/sec ±2.16% (117 runs sampled)'

'TRC-C simulation 100,000 90% x 6,660,546 ops/sec ±2.31% (112 runs sampled)'

'TRC-L simulation 100,000 90% x 6,263,904 ops/sec ±2.89% (110 runs sampled)'

'DWC   simulation 100,000 90% x 5,045,747 ops/sec ±4.65% (111 runs sampled)'

'Clock simulation 1,000,000 90% x 3,587,431 ops/sec ±4.83% (96 runs sampled)'

'ISC   simulation 1,000,000 90% x 2,312,996 ops/sec ±3.32% (104 runs sampled)'

'LRU   simulation 1,000,000 90% x 1,770,884 ops/sec ±2.79% (102 runs sampled)'

'TRC-C simulation 1,000,000 90% x 1,803,313 ops/sec ±3.00% (105 runs sampled)'

'TRC-L simulation 1,000,000 90% x 1,649,346 ops/sec ±1.57% (113 runs sampled)'

'DWC   simulation 1,000,000 90% x 1,589,534 ops/sec ±1.67% (115 runs sampled)'

'ISC   simulation 100 90% expire x 4,261,673 ops/sec ±4.13% (112 runs sampled)'

'DWC   simulation 100 90% expire x 7,782,281 ops/sec ±0.41% (123 runs sampled)'

'ISC   simulation 1,000 90% expire x 3,984,608 ops/sec ±4.70% (109 runs sampled)'

'DWC   simulation 1,000 90% expire x 7,160,830 ops/sec ±0.87% (121 runs sampled)'

'ISC   simulation 10,000 90% expire x 3,594,196 ops/sec ±2.68% (115 runs sampled)'

'DWC   simulation 10,000 90% expire x 5,985,963 ops/sec ±1.45% (120 runs sampled)'

'ISC   simulation 100,000 90% expire x 2,442,721 ops/sec ±3.29% (104 runs sampled)'

'DWC   simulation 100,000 90% expire x 2,143,528 ops/sec ±4.06% (108 runs sampled)'

'ISC   simulation 1,000,000 90% expire x 476,958 ops/sec ±5.88% (91 runs sampled)'

'DWC   simulation 1,000,000 90% expire x 582,347 ops/sec ±4.32% (106 runs sampled)'
```

## API

```ts
export class TLRU<K, V> {
  constructor(capacity: number, step?: number, window?: number, retrial?: boolean);
  readonly length: number;
  readonly size: number;
  add(key: K, value: V): boolean;
  set(key: K, value: V): this;
  get(key: K): V | undefined;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  [Symbol.iterator](): Iterator<[K, V], undefined, undefined>;
}
```
