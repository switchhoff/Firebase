export interface Room {
  id: string;
  name: string;
}

export interface Box {
  id: string;
  name: string;
  roomId: string;
  parentId?: string | null;
  code?: string;
  size?: string;
  tags?: string[];
}

export interface Item {
  id: string;
  name: string;
  boxId: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Owner {
  id: string;
  name: string;
}
