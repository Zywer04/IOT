# 声音分类 API 文档

## 基本信息
- 基础URL: `http://localhost:9999`
- 响应格式: JSON
- 编码方式: UTF-8

## 接口列表

### 1. 获取模型信息

#### 请求信息
- 接口URL: `/model_info`
- 请求方式: GET
- 请求参数: 无

#### 响应信息
```json
{
    "model_info": {
        "training_time": "2024-03-25 14:40:17",  // 模型训练时间
        "supported_classes": [                    // 支持的声音类别
            "Breathing",  // 呼吸声
            "Coughing",   // 咳嗽声
            "Sneezing",   // 打喷嚏声
            "Snoring"     // 打鼾声
        ],
        "evaluation": {                          // 模型评估结果
            "overall_metrics": {                 // 整体评估指标
                "accuracy": 0.75,                // 总体准确率
                "macro_avg": {                   // 宏平均指标
                    "precision": 0.75,           // 精确率
                    "recall": 0.77,              // 召回率
                    "f1-score": 0.74            // F1分数
                },
                "weighted_avg": {                // 加权平均指标
                    "precision": 0.76,
                    "recall": 0.75,
                    "f1-score": 0.74
                }
            },
            "class_metrics": {                   // 各类别评估指标
                "Breathing": {
                    "precision": 0.89,           // 精确率
                    "recall": 0.80,              // 召回率
                    "f1_score": 0.84,           // F1分数
                    "support": 10                // 测试样本数
                },
                // ... 其他类别的指标
            }
        }
    }
}
```

#### 响应字段说明
| 字段名 | 类型 | 说明 |
|--------|------|------|
| training_time | string | 模型训练完成时间 |
| supported_classes | array | 支持识别的声音类别列表 |
| evaluation.overall_metrics.accuracy | float | 模型总体准确率(0-1) |
| evaluation.overall_metrics.macro_avg | object | 各项指标的平均值 |
| evaluation.overall_metrics.weighted_avg | object | 考虑样本数的加权平均值 |
| evaluation.class_metrics | object | 每个类别的详细评估指标 |

### 2. 预测音频类别

#### 请求信息
- 接口URL: `/predict`
- 请求方式: POST
- Content-Type: application/json

#### 请求参数
```json
{
    "file_path": "D:/data/test.ogg"  // 音频文件的完整路径
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file_path | string | 是 | 待识别的音频文件路径，必须是.ogg格式 |

#### 响应信息
```json
{
    "prediction": {                     // 预测结果
        "class": "Breathing",           // 预测的声音类别
        "confidence": 0.85,             // 预测置信度
        "all_probabilities": {          // 所有类别的预测概率
            "Breathing": 0.85,
            "Coughing": 0.05,
            "Sneezing": 0.05,
            "Snoring": 0.05
        }
    },
    "audio_info": {                     // 音频信息
        "file_path": "D:/data/test.ogg",
        "file_name": "test.ogg",
        "file_size": 123456,            // 文件大小(字节)
        "duration": 3.0,                // 时长(秒)
        "sample_rate": 22050,           // 采样率(Hz)
        "n_samples": 66150              // 采样点数
    },
    "model_info": {                     // 模型分析信息
        "top_features": {               // 最重要的特征及其重要性
            "mfcc_mean_1": 0.15,
            "spectral_centroids_mean": 0.12,
            "zero_crossing_mean": 0.10,
            "mfcc_std_2": 0.08,
            "rmse_mean": 0.07
        },
        "timestamp": "2024-03-25 15:30:45"  // 预测时间
    }
}
```

#### 响应字段说明
| 字段名 | 类型 | 说明 |
|--------|------|------|
| prediction.class | string | 预测的声音类别 |
| prediction.confidence | float | 预测置信度(0-1) |
| prediction.all_probabilities | object | 每个类别的预测概率 |
| audio_info.file_size | integer | 文件大小(字节) |
| audio_info.duration | float | 音频时长(秒) |
| audio_info.sample_rate | integer | 采样率(Hz) |
| model_info.top_features | object | 对预测结果影响最大的特征 |
| model_info.timestamp | string | 预测执行时间 |

#### 错误响应
```json
{
    "error": "错误信息"
}
```

#### 可能的错误码
| HTTP状态码 | 说明 |
|------------|------|
| 400 | 请求参数错误，如未提供文件路径 |
| 404 | 文件不存在 |
| 500 | 服务器内部错误 |

## 调用示例

### Python
```python
import requests

# 获取模型信息
response = requests.get('http://localhost:9999/model_info')
print(response.json())

# 预测音频类别
data = {
    'file_path': 'D:/data/test.ogg'
}
response = requests.post('http://localhost:9999/predict', json=data)
print(response.json())
```

### curl
```bash
# 获取模型信息
curl http://localhost:9999/model_info

# 预测音频类别
curl -X POST http://localhost:9999/predict \
     -H "Content-Type: application/json" \
     -d '{"file_path": "D:/data/test.ogg"}'
``` 