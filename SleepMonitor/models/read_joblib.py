from joblib import load

# 假设你的文件名为 'model.joblib'
model = load('audio_classifier_20250325_160428.joblib')

# 你可以检查这个模型/对象的类型和内容
print(type(model))
print(model)
