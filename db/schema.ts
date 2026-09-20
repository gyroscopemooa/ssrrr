import {sqliteTable,text,integer,index,primaryKey,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const posts=sqliteTable('posts',{id:text('id').primaryKey(),owner:text('owner').notNull(),nickname:text('nickname').notNull(),title:text('title').notNull(),category:text('category').notNull(),body:text('body').notNull(),source:text('source').notNull().default(''),thumbnail:text('thumbnail').notNull().default(''),createdAt:integer('created_at').notNull(),hidden:integer('hidden').notNull().default(0),views:integer('views').notNull().default(0)},t=>[index('posts_feed').on(t.hidden,t.createdAt),index('posts_category').on(t.category,t.hidden,t.createdAt)]);
export const media=sqliteTable('media',{id:text('id').primaryKey(),owner:text('owner').notNull(),type:text('type').notNull(),size:integer('size').notNull(),createdAt:integer('created_at').notNull()});
export const comments=sqliteTable('comments',{id:text('id').primaryKey(),postId:text('post_id').notNull().references(()=>posts.id),owner:text('owner').notNull(),nickname:text('nickname').notNull(),body:text('body').notNull(),createdAt:integer('created_at').notNull()},t=>[index('comments_post').on(t.postId,t.createdAt)]);
export const likes=sqliteTable('likes',{postId:text('post_id').notNull().references(()=>posts.id),owner:text('owner').notNull()},t=>[primaryKey({columns:[t.postId,t.owner]})]);
export const reports=sqliteTable('reports',{id:text('id').primaryKey(),postId:text('post_id').notNull().references(()=>posts.id),owner:text('owner').notNull(),reason:text('reason').notNull(),createdAt:integer('created_at').notNull()},t=>[index('reports_post').on(t.postId)]);
export const quotas=sqliteTable('quotas',{id:text('id').primaryKey(),count:integer('count').notNull()});




export const settingsTable=sqliteTable('settings',{id:text('id').primaryKey(),value:text('value').notNull(),revision:integer('revision').notNull().default(0)});
export const members=sqliteTable('members',{owner:text('owner').primaryKey(),nickname:text('nickname').notNull().unique(),points:integer('points').notNull().default(0),createdAt:integer('created_at').notNull()});
export const purchases=sqliteTable('purchases',{id:text('id').primaryKey(),owner:text('owner').notNull().references(()=>members.owner),target:text('target').notNull(),postId:text('post_id').notNull().references(()=>posts.id),mediaId:text('media_id'),cost:integer('cost').notNull(),createdAt:integer('created_at').notNull()},t=>[uniqueIndex('purchase_owner_target').on(t.owner,t.target)]);
export const ledger=sqliteTable('ledger',{id:text('id').primaryKey(),owner:text('owner').notNull().references(()=>members.owner),delta:integer('delta').notNull(),reason:text('reason').notNull(),createdAt:integer('created_at').notNull()},t=>[index('ledger_member_time').on(t.owner,t.createdAt)]);
export const grants=sqliteTable('grants',{id:text('id').primaryKey(),owner:text('owner').notNull().references(()=>members.owner),amount:integer('amount').notNull(),reason:text('reason').notNull(),actor:text('actor').notNull(),createdAt:integer('created_at').notNull()});
export const audit=sqliteTable('audit',{id:text('id').primaryKey(),actor:text('actor').notNull(),action:text('action').notNull(),createdAt:integer('created_at').notNull()});
export const postViews=sqliteTable('post_views',{postId:text('post_id').notNull().references(()=>posts.id),viewer:text('viewer').notNull(),day:text('day').notNull()},t=>[primaryKey({columns:[t.postId,t.viewer,t.day]})]);
export const previews=sqliteTable('previews',{id:text('id').primaryKey(),url:text('url').notNull().unique(),title:text('title').notNull(),description:text('description').notNull(),imageId:text('image_id'),createdAt:integer('created_at').notNull()});

