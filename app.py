# -*- coding: utf-8 -*-
from flask import Flask, render_template, session, request, jsonify
from flask_socketio import SocketIO, send, emit
from threading import Lock
import csv
import numpy as np
import os
from sklearn.decomposition import PCA
from sklearn import svm
from sklearn.externals import joblib
import pandas as pd

app = Flask(__name__)
socketio = SocketIO(app)

thread = None
thread_lock = Lock()

SAMPLE_SIZE = 50
NB_DATA_POINTS_PER_SIG = 104
acc_buff = []
gyr_buff = []
mag_buff = []


ROOT = "/home/sicong/Projects/FourthYearProjects/BodySensorNetworks/zbgame/python/BSN"
NB_TESTS = 7

def createTestData():
    dfs = []
    for i in range(1, NB_TESTS):
        dfAcc = pd.read_csv(os.path.join(ROOT, "TestAcc-data ({}).csv".format(i)))
        dfGyr = pd.read_csv(os.path.join(ROOT, "TestGyroscope-data ({}).csv".format(i)))
        dfMag = pd.read_csv(os.path.join(ROOT, "TestMagnetometer-data ({}).csv".format(i)))

        size = min([len(dfAcc), len(dfGyr), len(dfMag)])
        df = pd.concat([dfAcc.iloc[range(size)], dfGyr.iloc[range(size)], dfMag.iloc[range(size)]], axis=1)
        dfs.append(df)
    result = pd.concat(dfs, axis=0)
    return result

#def getAcc(file_name):
#    with open(file_name, 'r') as f:
#        reader = csv.reader(f, delimiter=',')
#        for row_idx, row in enumerate(reader):
#            if row_idx != 0:
#                accData = list(map(float, row))
#                yield accData
#            if row_idx >= SAMPLE_SIZE:
#                break

def sendSensorData():
    for _, imu_data in test_data_df.iterrows():
        socketio.sleep(0.1)
        acc = [imu_data["acc1"].tolist(), imu_data["acc2"].tolist(), imu_data["acc3"].tolist()]
        gyr = [imu_data["gyx"].tolist(), imu_data["gyy"].tolist(), imu_data["gyz"].tolist()]
        mag = [imu_data["magx"].tolist(), imu_data["magy"].tolist(), imu_data["magz"].tolist()]
        data =  {
                "acc": acc,
                "gyr": gyr,
                "mag": mag
                }
        socketio.emit("sensor_data_server", {"data": data})


@socketio.on('client_connected')
def handle_client_connect_event(json):
    print("New client connected")
    print("Starting sending Acc data...")
    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(target=sendSensorData)

@socketio.on('message')
def handle_json_button(json):
    # it will forward the json to all clients.
    print("JSON BUTTON!")
    send(json, json=True)

@socketio.on('sensor_data')
def handle_data_event(json):
    new_data = json["data"]
    acc_buff.append(new_data["acc"])
    gyr_buff.append(new_data["gyr"])
    mag_buff.append(new_data["mag"])
    if len(acc_buff) > NB_DATA_POINTS_PER_SIG:
        # Assemble feature
        acc_feature = np.concatenate(acc_buff[:-1])
        gyr_feature = np.concatenate(gyr_buff[:-1])
        mag_feature = np.concatenate(mag_buff[:-1])
        feature = np.concatenate([acc_feature, gyr_feature, mag_feature])
        # Remove outdated data
        del acc_buff[0]
        del gyr_buff[0]
        del mag_buff[0]

        #print('======================')
        #print("Classification: ")
        #print(classify(feature.reshape(1, -1)))
        #print('======================')
        label = classify(feature.reshape(1, -1))
        socketio.emit("classification_server", {"label": label.tolist()})

@app.route('/')
def index():
    return render_template('index.html', async_mode=socketio.async_mode)


def classify(feature):
    projected_X = pca.transform(feature)
    dec = clf.decision_function(projected_X)
    return np.argmax(dec[0])

if __name__ == '__main__':
    test_data_df = createTestData()
    pca = joblib.load("PCA.pkl")
    clf = joblib.load("SVM.pkl")
    socketio.run(app, debug=True)
