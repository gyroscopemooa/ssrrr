export const boards=['전체','유머','짤','영상','SNS','이슈','자유','경제'] as const;
export const moderationBoards=boards.filter(board=>board!=='전체');
export const postBoards=moderationBoards.filter(board=>board!=='경제');
export const userPostBoards=postBoards;
export const snsTopics=['인스타 릴스','틱톡','유튜브 쇼츠','인플루언서','오프더레코드','기타 SNS'] as const;
export function boardLabel(board:string){return board==='전체'?'전체 이야기':board==='유머'?'오늘의유머':board==='자유'?'자유게시판':board}
export function boardDescription(board:string){return board==='유머'?'꿀잼픽과 로그인 회원이 함께 올리는 오늘의 유머':board==='SNS'?'릴스·틱톡·쇼츠부터 인플루언서와 오프더레코드까지':board==='경제'?'자동으로 모이는 최신 경제 소식을 한곳에서 확인하세요.':board==='자유'?'로그인 회원이 자유롭게 이야기하는 게시판':'웃긴 건 같이 보자. 오늘도 가볍게, 한바탕.'}
