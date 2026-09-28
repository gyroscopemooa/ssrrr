const logos=['/images/ssrrr-logo-1.png','/images/ssrrr-logo-2.png','/images/ssrrr-logo-3.png'];

export function RotatingLogo(){return <span className="rotating-logo-wrap"><span className="rotating-logo" role="img" aria-label="SSRRR 스르륵 유머 커뮤니티 로고" title="스르륵~!">{logos.map((src,index)=><span className={'rotating-logo-image rotating-logo-image-'+(index+1)} style={{backgroundImage:`url(${src})`}} aria-hidden="true" key={src}/>)}</span><span className="logo-tooltip" aria-hidden="true">스르륵~!</span></span>}
