const BorderEffect = ({ width = 457, height = 7 }) => {
    return (
        <svg width={width + 'px'} height={height + 'px'} viewBox="0 0 459 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M454 4H4.5C4.22386 4 4 3.77614 4 3.5C4 3.22386 4.22387 3 4.50001 3H454C454.276 3 454.5 3.22386 454.5 3.5C454.5 3.77614 454.276 4 454 4Z" stroke="#1B1C20" />
            <circle cx="3.5" cy="3.5" r="3.5" fill="#38E5FF" />
            <circle cx="455.5" cy="3.5" r="3.5" fill="#38E5FF" />
        </svg>
    )
}

export default BorderEffect
