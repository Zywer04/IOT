import librosa
import numpy as np
from scipy.stats import skew, kurtosis
from joblib import load

def extract_features(y, sr):
    # --- 频域特征 ---
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    delta1 = librosa.feature.delta(mfcc)
    delta2 = librosa.feature.delta(mfcc, order=2)

    mfcc_mean = np.mean(mfcc.T, axis=0)
    delta1_mean = np.mean(delta1.T, axis=0)
    delta2_mean = np.mean(delta2.T, axis=0)

    centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
    bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr))
    rolloff = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))

    # --- 统计特征 ---
    mean_val = np.mean(y)
    std_val = np.std(y)
    skew_val = skew(y)
    kurt_val = kurtosis(y)

    # --- 合并特征 ---
    features = np.concatenate([
        mfcc_mean,
        delta1_mean,
        delta2_mean,
        [centroid, bandwidth, rolloff],
        [mean_val, std_val, skew_val, kurt_val]
    ])
    return features


# ------------------------------
# 主流程（检测打鼾时间段）
# ------------------------------

model = load('audio_classifier_20250325_160428.joblib')
labels = ['Coughing', 'Snoring', 'Sneezing', 'Breathing']

audio_path = 'sleep_audio.wav'
y, sr = librosa.load(audio_path, sr=None)

segment_duration = 2
segment_samples = segment_duration * sr
total_segments = len(y) // segment_samples

snoring_segments = []

for i in range(total_segments):
    start_sample = i * segment_samples
    end_sample = start_sample + segment_samples
    segment = y[start_sample:end_sample]

    if len(segment) < segment_samples:
        continue

    feature_vector = extract_features(segment, sr).reshape(1, -1)

    if feature_vector.shape[1] != model.n_features_in_:
        print(f"[!] 特征维度不匹配: 当前 {feature_vector.shape[1]}，模型期望 {model.n_features_in_}")
        continue

    pred_index = model.predict(feature_vector)[0]
    pred_label = pred_index

    if pred_label == "Snoring":
        snoring_segments.append((
            i * segment_duration,
            (i + 1) * segment_duration
        ))

def format_time(seconds):
    return f"{int(seconds // 60):02d}:{int(seconds % 60):02d}"

print("检测到的打鼾时间段：")
for start, end in snoring_segments:
    print(f"{format_time(start)} - {format_time(end)}")
