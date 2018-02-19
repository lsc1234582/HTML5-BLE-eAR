#import pandas as pd
import csv
import numpy as np
import os
from sklearn.decomposition import PCA
from sklearn import svm
from sklearn.externals import joblib

# Number of training samples for each class
# NB: Number of training samples = NB_TRAIN_PER_CLS * number of classes
NB_TRAIN_PER_CLS = 5

# Number of data points for each signal
# NB: Feature size = NB_DATA_POINTS_PER_SIG * number of components for each signal * number of signals
NB_DATA_POINTS_PER_SIG = 104

# Number of components
NB_COMP = 60

CSV_DATA_FOLDER_ROOT = "/Users/marieberard/Desktop/BSN"

def getCSVData(file_name, nb_data_points):
    """
    Read nb_data_points number of rows of a csv file and concatenate all entries into a single
    vector of shape (nb_data_points * number of columns, )
    """
    acc_data_arr = []
    with open(os.path.join(CSV_DATA_FOLDER_ROOT, file_name), 'r') as f:
        reader = csv.reader(f, delimiter=',')
        for row_idx, row in enumerate(reader):
            if row_idx != 0:
                acc_data = list(map(float, row))
                acc_data_arr.append(acc_data)
            if row_idx >= nb_data_points:
                break
    return np.concatenate(acc_data_arr)


def createTrainingData(nb_train_per_cls, nb_data_points_per_sig):
    """
    WARN: The data files are hard coded

    Create a training input Xs of shape (number of training samples, feature size)
    , a training label Xs of shape (number of training samples, 1)
    and a label to class name map
    """
    Xs = []
    Ys = []
    label_to_cls_name = ["Jump", "Run", "LeanLeft", "LeanRight", "TurnAround", "Idle"]
    # Add data for class Jump
    for i in range(1, nb_train_per_cls):
        feature = []
        file_acc ="JAcc-data ({}).csv".format(i)
        feature.append(getCSVData(file_acc, nb_data_points_per_sig))
        file_gyr = "JGyroscope-data ({}).csv".format(i)
        feature.append(getCSVData(file_gyr, nb_data_points_per_sig))
        #file_mag = "JMagnetometer-data ({}).csv".format(i)
        #feature.append(getCSVData(file_mag, nb_data_points_per_sig))
        Xs.append(np.concatenate(feature).reshape(1, -1))
        Ys.append(0)

    # Add data for class Run
    for i in range(1, nb_train_per_cls):
        feature = []
        file_acc ="UAcc-data ({}).csv".format(i)
        feature.append(getCSVData(file_acc, nb_data_points_per_sig))
        file_gyr = "UGyroscope-data ({}).csv".format(i)
        feature.append(getCSVData(file_gyr, nb_data_points_per_sig))
        #file_mag = "UMagnetometer-data ({}).csv".format(i)
        #feature.append(getCSVData(file_mag, nb_data_points_per_sig))
        Xs.append(np.concatenate(feature).reshape(1, -1))
        Ys.append(1)

    # Add data for class LearnLeft
    for i in range(1, nb_train_per_cls):
        feature = []
        file_acc ="LAcc-data ({}).csv".format(i)
        feature.append(getCSVData(file_acc, nb_data_points_per_sig))
        file_gyr = "LGyroscope-data ({}).csv".format(i)
        feature.append(getCSVData(file_gyr, nb_data_points_per_sig))
        #file_mag = "LMagnetometer-data ({}).csv".format(i)
        #feature.append(getCSVData(file_mag, nb_data_points_per_sig))
        Xs.append(np.concatenate(feature).reshape(1, -1))
        Ys.append(2)

    # Add data for class LearnRight
    for i in range(1, nb_train_per_cls):
        feature = []
        file_acc ="RAcc-data ({}).csv".format(i)
        feature.append(getCSVData(file_acc, nb_data_points_per_sig))
        file_gyr = "RGyroscope-data ({}).csv".format(i)
        feature.append(getCSVData(file_gyr, nb_data_points_per_sig))
        #file_mag = "RMagnetometer-data ({}).csv".format(i)
        #feature.append(getCSVData(file_mag, nb_data_points_per_sig))
        Xs.append(np.concatenate(feature).reshape(1, -1))
        Ys.append(3)

    # Add data for class TurnAround
    for i in range(1, nb_train_per_cls):
        feature = []
        file_acc ="TAcc-data ({}).csv".format(i)
        feature.append(getCSVData(file_acc, nb_data_points_per_sig))
        file_gyr = "TGyroscope-data ({}).csv".format(i)
        feature.append(getCSVData(file_gyr, nb_data_points_per_sig))
        #file_mag = "TMagnetometer-data ({}).csv".format(i)
        #feature.append(getCSVData(file_mag, nb_data_points_per_sig))
        Xs.append(np.concatenate(feature).reshape(1, -1))
        Ys.append(4)

    # Add data for class Idle
    for i in range(1, nb_train_per_cls):
        feature = []
        file_acc ="IAcc-data ({}).csv".format(i)
        feature.append(getCSVData(file_acc, nb_data_points_per_sig))
        file_gyr = "IGyroscope-data ({}).csv".format(i)
        feature.append(getCSVData(file_gyr, nb_data_points_per_sig))
        #file_mag = "IMagnetometer-data ({}).csv".format(i)
        #feature.append(getCSVData(file_mag, nb_data_points_per_sig))
        Xs.append(np.concatenate(feature).reshape(1, -1))
        Ys.append(5)

    Xs = np.concatenate(Xs, axis=0)
    Ys = np.array(Ys).reshape(-1, 1)
    return Xs, Ys, label_to_cls_name


def trainPCA(train_data, nb_comp):
    """
    Train a PCA with train data and number of components nb_comp
    """
    pca = PCA(nb_comp)
    projected_data = pca.fit_transform(train_data)
    return pca, projected_data

def trainSVM(Xs, Ys):
    """
    Train an SVM with training data Xs(features) and Ys(labels)
    """
    clf = svm.LinearSVC(random_state=0)
    clf.fit(Xs, Ys)
    return clf

if __name__ == "__main__":
    if not os.path.isfile("TrainingData.pkl"):
        # Assemble and save training data from csv files
        Xs, Ys, label_to_cls_name = createTrainingData(NB_TRAIN_PER_CLS, NB_DATA_POINTS_PER_SIG)
        training_data = {"Xs": Xs, "Ys": Ys, "label_to_cls_name": label_to_cls_name}
        joblib.dump(training_data, "TrainingData.pkl")
    else:
        training_data = joblib.load("TrainingData.pkl")
        Xs = training_data["Xs"]
        Ys = training_data["Ys"]
        label_to_cls_name = training_data["label_to_cls_name"]

    # Train and persist pca and svm
    pca, projected_Xs = trainPCA(Xs, NB_COMP)
    clf = trainSVM(projected_Xs, Ys)
    joblib.dump(pca, "PCA.pkl")
    joblib.dump(clf, "SVM.pkl")

    # Test pca and svm
    nb_test = 7
    pred_Ys = []
    for i in range(1, nb_test):
        feature = []
        file_acc ="TestAcc-data ({}).csv".format(i)
        feature.append(getCSVData(file_acc, NB_DATA_POINTS_PER_SIG))
        file_gyr = "TestGyroscope-data ({}).csv".format(i)
        feature.append(getCSVData(file_gyr, NB_DATA_POINTS_PER_SIG))
        #file_mag = "TestMagnetometer-data ({}).csv".format(i)
        #feature.append(getCSVData(file_mag, NB_DATA_POINTS_PER_SIG))
        feature = np.concatenate(feature).reshape(1, -1)

        projected_X = pca.transform(feature)
        dec = clf.decision_function(projected_X)
        pred_Ys.append(np.argmax(dec[0]))

    print(pred_Ys)
