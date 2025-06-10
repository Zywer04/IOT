const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const { SerialPort } = require('serialport');

const app = express();
const port = 3000; // 端口

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

let serialPort;
let serialError = null;
let latestParsedData = null;

const minuteData = {};  // 缓存每分钟数据

try {
  const portName = 'COM5'; 
  serialPort = new SerialPort({ path: portName, baudRate: 9600 });

  // 缓冲区拼接字符串
  let bufferStr = '';

  serialPort.on('open', () => {
    console.log(` √ 串口连接成功: ${portName}`);
    console.log(` √ 串口配置: 波特率=${serialPort.baudRate}, 路径=${serialPort.path}`);
  });

  serialPort.on('error', (err) => {
    console.error(' ✗ 串口错误:', err.message);
    serialError = err.message;
  });

  serialPort.on('data', (raw) => {
    bufferStr += raw.toString('utf8');

    const regex = /A:(\d+)#,\s*B:(\d+)#,\s*C:(\d+(\.\d+)?)#/g;
    let match;
    while ((match = regex.exec(bufferStr)) !== null) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      const timeKey = `${year}-${month}-${date}-${hour}-${minute}`;
      const parsed = {
        A: parseInt(match[1], 10),
        B: parseInt(match[2], 10),
        C: parseFloat(match[3]),
      };
      latestParsedData = parsed;
      if (!minuteData[timeKey]) {
        minuteData[timeKey] = { A: 0, Acount: 0, B: 0, Bcount: 0, C: 0, Ccount: 0 };
      }
      if (parsed.A !== 0) {
        minuteData[timeKey].A += parsed.A;
        minuteData[timeKey].Acount++;
      }
      if (parsed.B !== 0) {
        minuteData[timeKey].B += parsed.B;
        minuteData[timeKey].Bcount++;
      }
      if (parsed.C !== 0) {
        minuteData[timeKey].C += parsed.C;
        minuteData[timeKey].Ccount++;
      }
      const timestamp = now.toISOString();
      console.log(`时间戳: ${timestamp}`);
      console.log(`原始数据: ${match[0]}`);
      console.log(`解析结果: A=${parsed.A}, B=${parsed.B}, C=${parsed.C}`);
    }
    // 删除已经匹配的数据，保留剩余未匹配的碎片
    bufferStr = bufferStr.slice(regex.lastIndex);
    regex.lastIndex = 0;
  });

} catch (err) {
  console.error('✗ 串口初始化失败:', err.message);
  serialError = err.message;
}

// MySQL 数据库配置
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'sleepdata'
});

db.connect((err) => {
  if (err) {
    console.error(' ✗ 数据库连接失败:', err);
  } else {
    console.log('√ 数据库连接成功');
  }
});

// 计算上一分钟平均并写入数据库
function insertMinuteAverageToDB(timeKey) {
  const data = minuteData[timeKey] || { A: 0, Acount: 0, B: 0, Bcount: 0, C: 0, Ccount: 0 };

  const avgA = data.Acount > 0 ? (data.A / data.Acount) : 0;
  const avgB = data.Bcount > 0 ? (data.B / data.Bcount) : 0;
  const avgC = data.Ccount > 0 ? (data.C / data.Ccount) : 0;

  const sql = 'INSERT INTO sleepbasic (time, hrate, bo2, temper) VALUES (?, ?, ?, ?)';

  db.query(sql, [timeKey, avgA, avgB, avgC], (err) => {
    if (err) {
      console.error(`数据库插入失败: ${timeKey}`, err);
    } else {
      console.log(`数据库插入成功: ${timeKey}  hrate=${avgA.toFixed(2)}, bo2=${avgB.toFixed(2)}, temper=${avgC.toFixed(2)}`);
      delete minuteData[timeKey];
    }
  });
}

// 定时任务，每分钟结束时触发，保存上一分钟数据
function scheduleMinuteInsert() {
  const now = new Date();

  const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  setTimeout(() => {
    const lastMinute = new Date(Date.now() - 60 * 1000);
    const year = lastMinute.getFullYear();
    const month = String(lastMinute.getMonth() + 1).padStart(2, '0');
    const date = String(lastMinute.getDate()).padStart(2, '0');
    const hour = String(lastMinute.getHours()).padStart(2, '0');
    const minute = String(lastMinute.getMinutes()).padStart(2, '0');
    const lastMinuteKey = `${year}-${month}-${date}-${hour}-${minute}`;

   // insertMinuteAverageToDB(lastMinuteKey);

    scheduleMinuteInsert();
  }, delay);
}

// 启动定时任务
scheduleMinuteInsert();

// 首页路由
app.get('/', (req, res) => {
  res.send('Hello, Sleep Monitor Backend!');
});

// 接口：数据库测试
app.get('/db-test', (req, res) => {
  db.query('SELECT NOW() AS now', (err, results) => {
    if (err) {
      res.status(500).json({ error: '数据库查询失败', details: err });
    } else {
      res.json({ time: results[0].now });
    }
  });
});

const readline = require('readline');

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 接口测试
app.get('/productdata', async (req, res) => {
  try {
    const number = await new Promise((resolve) => {
      rl.question('请输入一个数字：', (answer) => {
        resolve(answer);
      });
    });
    res.json({
      inputNumber: number
    });

  } catch (err) {
    res.status(500).json({ error: '处理失败', details: err });
  }
});

app.get('/db-get', (req, res) => {
  // 获取当前时间的前24小时的时间范围字符串，格式：YYYY-MM-DD-HH
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  // 计算24小时前的时间点
  const past24h = new Date(now.getTime() - 24 * 3600 * 1000);
  const pastYear = past24h.getFullYear();
  const pastMonth = String(past24h.getMonth() + 1).padStart(2, '0');
  const pastDate = String(past24h.getDate()).padStart(2, '0');
  const pastHour = String(past24h.getHours()).padStart(2, '0');
  // 生成字符串时间范围起点
  const startTimeStr = `${pastYear}-${pastMonth}-${pastDate}-${pastHour}`;
  const sql = `
    SELECT 
      LEFT(time, 13) AS hourTime,
      AVG(NULLIF(hrate, 0)) AS avgHrate,
      AVG(NULLIF(bo2, 0)) AS avgBo2,
      AVG(NULLIF(temper, 0)) AS avgTemper
    FROM sleepbasic
    WHERE time >= ?
    GROUP BY hourTime
    ORDER BY hourTime ASC
    LIMIT 24
  `;
  console.log(' 正在执行 SQL:', sql, '参数:', [startTimeStr]);
  db.query(sql, [startTimeStr], (err, results) => {
    if (err) {
      console.error(' ✗ 数据库查询失败:', err);
      res.status(500).json({
        error: '数据库查询失败',
        details: err.message || err,
        sql: sql,
      });
    } else {
      // 格式化数据，保留2位小数，防止null显示
      const formatted = results.map(row => ({
        time: row.hourTime,
        hrate: row.avgHrate ? parseFloat(row.avgHrate.toFixed(2)) : 0,
        bo2: row.avgBo2 ? parseFloat(row.avgBo2.toFixed(2)) : 0,
        temper: row.avgTemper ? parseFloat(row.avgTemper.toFixed(2)) : 0,
      }));
      console.log(` √ 查询成功，返回小时数: ${formatted.length}`);
      res.json({
        data: formatted,
        count: formatted.length,
        sqlExecuted: sql
      });
    }
  });
});

//启动服务
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server is running `);
});

