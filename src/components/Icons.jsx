import React from 'react';

export function MenuIcon(props) {
	return (
  <svg xmlns="http://www.w3.org/2000/svg" width={48} height={48} viewBox="0 0 50 50" {...props}>
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}>
      <path stroke="#8DC63F" d="M6.25 25h37.5"></path>
      <path stroke="#783FC6" d="M6.25 12.5h25m-12.5 25h25z"></path>
    </g>
  </svg>);
}


export function CloseIcon(props) {
	return (
  <svg xmlns="http://www.w3.org/2000/svg" width={48} height={48} viewBox="0 0 48 48" {...props}>
    <defs>
      <mask id="ipTCloseOne0">
        <g fill="none" stroke="#fff" strokeLinejoin="round" strokeWidth={2.3}>
          <path fill="#262626" d="M24 44c11.046 0 20-8.954 20-20S35.046 4 24 4S4 12.954 4 24s8.954 20 20 20Z"></path>
          <path strokeLinecap="round" d="M29.657 18.343L18.343 29.657m0-11.314l11.314 11.314"></path>
        </g>
      </mask>
    </defs>
    <path fill="#783FC6" d="M0 0h48v48H0z" mask="url(#ipTCloseOne0)"></path>
  </svg>
  );
}


export function RightArrow(props) {
	return (<svg xmlns="http://www.w3.org/2000/svg" width={48} height={48} viewBox="0 0 50 50" {...props}><g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4}><path stroke="#8DC63F" d="M16.667 25h16.666m-5.208-5.208L33.333 25l-5.208 5.208"></path><path stroke="#783FC6" d="M25 43.75c10.355 0 18.75-8.395 18.75-18.75S35.355 6.25 25 6.25S6.25 14.645 6.25 25S14.645 43.75 25 43.75"></path></g></svg>);
}