import { collection, doc, setDoc, deleteDoc, query, where, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const blockUser = async (blockerUid: string, blockedUid: string) => {
  const blockId = `${blockerUid}_${blockedUid}`;
  await setDoc(doc(db, 'blocks', blockId), {
    blockerUid,
    blockedUid,
    createdAt: serverTimestamp()
  });
};

export const unblockUser = async (blockerUid: string, blockedUid: string) => {
  const blockId = `${blockerUid}_${blockedUid}`;
  await deleteDoc(doc(db, 'blocks', blockId));
};

export const isUserBlocked = async (blockerUid: string, blockedUid: string) => {
  const blockId = `${blockerUid}_${blockedUid}`;
  const blockDoc = await getDoc(doc(db, 'blocks', blockId));
  return blockDoc.exists();
};

export const getBlockedUsers = (blockerUid: string, callback: (blockedUids: string[]) => void) => {
  const q = query(collection(db, 'blocks'), where('blockerUid', '==', blockerUid));
  return onSnapshot(q, (snapshot) => {
    const blockedUids = snapshot.docs.map(doc => doc.data().blockedUid);
    callback(blockedUids);
  });
};

export const getUsersWhoBlockedMe = (myUid: string, callback: (blockerUids: string[]) => void) => {
  const q = query(collection(db, 'blocks'), where('blockedUid', '==', myUid));
  return onSnapshot(q, (snapshot) => {
    const blockerUids = snapshot.docs.map(doc => doc.data().blockerUid);
    callback(blockerUids);
  });
};
