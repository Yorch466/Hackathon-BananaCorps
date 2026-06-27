export interface MessageAction {
  label: string;
  id:    string;
  type:  'taller' | 'proveedor';
}

export interface Message {
  role:     'user' | 'model';
  text:     string;
  actions?: MessageAction[];
}
