'use server';

import { revalidatePath } from 'next/cache';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  writeBatch,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Box, Item, Owner, Room, Tag } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Room Actions
export async function addRoom(name: string) {
  if (!name) {
    return { error: 'Room name is required.' };
  }
  const roomData = { name };
  const collectionRef = collection(db, 'rooms');
  
  try {
    const docRef = await addDoc(collectionRef, roomData);
    revalidatePath('/');
    revalidatePath('/settings');
    return { id: docRef.id, ...roomData };
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: `${collectionRef.path}/<new_room_id>`,
      operation: 'create',
      requestResourceData: roomData,
    });
    errorEmitter.emit('permission-error', permissionError);
    return { error: 'Failed to create room.' };
  }
}

export async function getRooms(): Promise<Room[]> {
  const q = query(collection(db, 'rooms'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
    };
  });
}

export async function updateRoom(roomId: string, name: string) {
  if (!roomId || !name) {
    return { error: 'Room ID and name are required.' };
  }
  const roomRef = doc(db, 'rooms', roomId);
  try {
    await updateDoc(roomRef, { name });
    revalidatePath('/');
    revalidatePath('/settings');
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: roomRef.path,
      operation: 'update',
      requestResourceData: { name },
    });
    errorEmitter.emit('permission-error', permissionError);
  }
}

export async function deleteRoom(roomId: string) {
  if (!roomId) {
    return { error: 'Room ID is required.' };
  }
  
  try {
    const batch = writeBatch(db);
    const roomRef = doc(db, 'rooms', roomId);

    // Find all boxes in the room
    const boxesQuery = query(collection(db, 'boxes'), where('roomId', '==', roomId));
    const boxesSnapshot = await getDocs(boxesQuery);
    
    // For each box, find and delete its items
    for (const boxDoc of boxesSnapshot.docs) {
      const itemsQuery = query(collection(db, 'items'), where('boxId', '==', boxDoc.id));
      const itemsSnapshot = await getDocs(itemsQuery);
      itemsSnapshot.forEach((itemDoc) => {
        batch.delete(itemDoc.ref);
      });
      batch.delete(boxDoc.ref);
    }
    
    batch.delete(roomRef);

    await batch.commit();
    revalidatePath('/');
    revalidatePath('/settings');
  } catch (error) {
     const permissionError = new FirestorePermissionError({
        path: `rooms/${roomId} and its contents`,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
  }
}

// Box Actions
export async function addBox(formData: FormData) {
  const name = formData.get('name') as string;
  const roomId = formData.get('roomId') as string;
  const parentId = formData.get('parentId') as string | null;
  const tags = formData.getAll('tags') as string[];

  if (!name || !roomId) {
    return { error: 'Box name/owner and room are required.' };
  }

  const boxData: { 
    name: string; 
    roomId: string; 
    parentId: string | null;
    code?: string;
    size?: string;
    tags?: string[];
  } = { name, roomId, parentId: parentId || null };

  if (!parentId) {
    const size = formData.get('size') as string;
    if (!size) {
      return { error: 'Box size is required for top-level boxes.' };
    }
    boxData.size = size;
    boxData.tags = tags;

    // Generate unique code
    const boxesQuery = query(collection(db, 'boxes'));
    const querySnapshot = await getDocs(boxesQuery);
    const existingCodes = querySnapshot.docs
      .map(doc => doc.data().code)
      .filter((code): code is string => !!code);

    let newCode = 'A01';
    if (existingCodes.length > 0) {
      existingCodes.sort();
      const lastCode = existingCodes[existingCodes.length - 1];
      let letter = lastCode.substring(0, 1);
      let number = parseInt(lastCode.substring(1), 10);

      if (number < 99) {
        number++;
      } else {
        number = 1;
        letter = String.fromCharCode(letter.charCodeAt(0) + 1);
      }

      if (letter > 'Z') {
        console.warn("Maximum box code reached (Z99).");
      }

      newCode = `${letter}${String(number).padStart(2, '0')}`;
    }
    boxData.code = newCode;
  }

  const collectionRef = collection(db, 'boxes');

  try {
    const docRef = await addDoc(collectionRef, boxData);
    revalidatePath('/');
    return { id: docRef.id, ...boxData };
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: `${collectionRef.path}/<new_box_id>`,
      operation: 'create',
      requestResourceData: boxData,
    });
    errorEmitter.emit('permission-error', permissionError);
    return { error: 'Failed to create box.' };
  }
}

export async function getBoxes(): Promise<Box[]> {
    const q = query(collection(db, 'boxes'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            roomId: data.roomId,
            parentId: data.parentId || null,
            code: data.code,
            size: data.size,
            tags: data.tags || [],
        };
    });
}


export async function getBoxWithRoom(boxId: string): Promise<{ box: Box; roomName: string } | null> {
  const boxRef = doc(db, 'boxes', boxId);
  const boxSnap = await getDoc(boxRef);

  if (!boxSnap.exists()) {
    return null;
  }
  const boxData = boxSnap.data();
  const box: Box = { 
    id: boxSnap.id, 
    name: boxData.name,
    roomId: boxData.roomId,
    parentId: boxData.parentId || null,
    code: boxData.code,
    size: boxData.size,
    tags: boxData.tags || [],
  };

  let roomName = 'Unassigned';
  if (box.roomId) {
    try {
      const roomRef = doc(db, 'rooms', box.roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        roomName = roomSnap.data().name;
      }
    } catch (e) {
      console.log('Could not find room with id ' + box.roomId);
    }
  }

  return { box, roomName };
}

export async function updateBox(boxId: string, data: Partial<Omit<Box, 'id'>>) {
  if (!boxId) {
    return { error: 'Box ID is required.' };
  }
  const boxRef = doc(db, 'boxes', boxId);
  try {
    await updateDoc(boxRef, data);
    revalidatePath('/');
    revalidatePath(`/box/${boxId}`);
    revalidatePath('/settings');
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: boxRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  }
}

export async function deleteBox(boxId: string) {
  if (!boxId) {
    return { error: 'Box ID is required.' };
  }
  
  try {
    const batch = writeBatch(db);
    
    // Recursive function to find all descendant boxes and items
    async function recursivelyDelete(currentBoxId: string) {
      // Find items and child boxes concurrently
      const itemsQuery = query(collection(db, 'items'), where('boxId', '==', currentBoxId));
      const childrenQuery = query(collection(db, 'boxes'), where('parentId', '==', currentBoxId));

      const [itemsSnapshot, childrenSnapshot] = await Promise.all([
        getDocs(itemsQuery),
        getDocs(childrenQuery),
      ]);

      // Delete items in the current box
      itemsSnapshot.forEach((itemDoc) => batch.delete(itemDoc.ref));

      // Recursively delete child boxes concurrently
      await Promise.all(
        childrenSnapshot.docs.map((childDoc) => recursivelyDelete(childDoc.id))
      );

      // Delete the current box itself
      batch.delete(doc(db, 'boxes', currentBoxId));
    }

    await recursivelyDelete(boxId);
    await batch.commit();

    revalidatePath('/');
    revalidatePath('/settings');
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: `boxes/${boxId} and its descendants`,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  }
}

// Item Actions
export async function addItem(name: string, boxId: string) {
  if (!name || !boxId) {
    return { error: 'Item name and box ID are required.' };
  }
  const itemData = { name, boxId };
  const collectionRef = collection(db, 'items');

  try {
    const docRef = await addDoc(collectionRef, itemData);
    revalidatePath('/');
    return { id: docRef.id, ...itemData };
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: `${collectionRef.path}/<new_item_id>`,
      operation: 'create',
      requestResourceData: itemData,
    });
    errorEmitter.emit('permission-error', permissionError);
    return { error: 'Failed to create item.' };
  }
}

export async function getItems(): Promise<Item[]> {
  const q = query(collection(db, 'items'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      boxId: data.boxId,
    };
  });
}

export async function getItemsForBox(boxId: string): Promise<Item[]> {
  const q = query(collection(db, 'items'), where('boxId', '==', boxId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      boxId: data.boxId,
    };
  });
}

export async function updateItem(itemId: string, data: Partial<Omit<Item, 'id'>>) {
  if (!itemId) {
    return { error: 'Item ID is required.' };
  }
  const itemRef = doc(db, 'items', itemId);
  try {
    await updateDoc(itemRef, data);
    revalidatePath('/');
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: itemRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  }
}

export async function deleteItem(itemId: string) {
  if (!itemId) {
    return { error: 'Item ID is required.' };
  }
  const itemRef = doc(db, 'items', itemId);
  try {
    await deleteDoc(itemRef);
    revalidatePath('/');
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: itemRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  }
}

// Owner Actions
export async function getOwners(): Promise<Owner[]> {
  const q = query(collection(db, 'owners'));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));
  } catch (error) {
    console.error("Error fetching owners: ", error);
    return [];
  }
}

export async function addOwner(name: string): Promise<{ id: string; name: string } | { error: string }> {
  if (!name) {
    return { error: 'Owner name is required.' };
  }
  const ownerName = name.trim();
  const ownersQuery = query(collection(db, 'owners'), where('name', '==', ownerName));
  
  try {
    const querySnapshot = await getDocs(ownersQuery);
    if (!querySnapshot.empty) {
      // Return existing owner
      const doc = querySnapshot.docs[0];
      return { id: doc.id, name: doc.data().name };
    }
    
    const ownerData = { name: ownerName };
    const collectionRef = collection(db, 'owners');
    const docRef = await addDoc(collectionRef, ownerData);
    revalidatePath('/');
    revalidatePath('/settings');
    return { id: docRef.id, name: ownerName };
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: `owners/<new_owner_id>`,
      operation: 'create',
      requestResourceData: { name: ownerName },
    });
    errorEmitter.emit('permission-error', permissionError);
    return { error: 'Failed to create owner.' };
  }
}

// Tag Actions
export async function getTags(): Promise<Tag[]> {
  const q = query(collection(db, 'tags'));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));
  } catch (error) {
    console.error("Error fetching tags: ", error);
    return [];
  }
}

export async function addTag(name: string): Promise<{ id: string; name: string } | { error: string }> {
  if (!name) {
    return { error: 'Tag name is required.' };
  }
  const tagName = name.trim();
  const tagsQuery = query(collection(db, 'tags'), where('name', '==', tagName));
  
  try {
    const querySnapshot = await getDocs(tagsQuery);
    if (!querySnapshot.empty) {
      // Return existing tag
      const doc = querySnapshot.docs[0];
      return { id: doc.id, name: doc.data().name };
    }
    
    const tagData = { name: tagName };
    const collectionRef = collection(db, 'tags');
    const docRef = await addDoc(collectionRef, tagData);
    revalidatePath('/');
    revalidatePath('/settings');
    return { id: docRef.id, name: tagName };
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: `tags/<new_tag_id>`,
      operation: 'create',
      requestResourceData: { name: tagName },
    });
    errorEmitter.emit('permission-error', permissionError);
    return { error: 'Failed to create tag.' };
  }
}
