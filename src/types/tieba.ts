// types/tieba.ts

export interface TiebaComment {
  cid: string;
  pid: string;
  content: string;
  create_time: string;
  nick_name: string;
  portrait: string;
}

export interface TiebaPost {
  pid?: string;
  content: string;
  create_time: string;
  nick_name: string;
  portrait: string;
  comments?: TiebaComment[]; // 🚀新增：这层楼包含的子评论
}

export interface TiebaThreadDetail {
  thread: TiebaPost & { tid: string, title: string };
  posts: TiebaPost[];
}

export interface TiebaFeedItem {
  source_type: 'thread' | 'post' | 'comment';
  tid: string;
  fname: string;
  thread_title: string;
  hit_content: string;
  raw_contents:string;
  nick_name: string;
  portrait: string;
  create_time: string;
}