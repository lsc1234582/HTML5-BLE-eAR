import os
import pandas as pd

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
