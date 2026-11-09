import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {setGlobalOptions} from "firebase-functions";

initializeApp();
setGlobalOptions({maxInstances: 10});

export const db = getFirestore();
export const auth = getAuth();
export const storage = getStorage();
