export const boards=['전체','유머','짤','영상','SNS','이슈','자유','경제'] as const;
export const postBoards=boards.filter(board=>board!=='전체');
export const snsTopics=['틱톡','인스타·릴스','유튜브·쇼츠','기타 SNS'] as const;
export function boardLabel(board:string){return board==='전체'?'전체 이야기':board==='유머'?'오늘의유머':board==='자유'?'자유게시판':board}
export function boardDescription(board:string){return board==='유머'?'꿀잼픽과 로그인 회원이 함께 올리는 오늘의 유머':board==='SNS'?'틱톡·릴스·쇼츠와 SNS 화제글을 함께 보는 게시판':board==='자유'?'로그인 회원이 자유롭게 이야기하는 게시판':'웃긴 건 같이 보자. 오늘도 가볍게, 한바탕.'}
