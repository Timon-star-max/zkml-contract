import './banner.css';
import BannerIcon from '../assets/svg/BannerIcon.svg'
const Banner = () => {
    return (
        <>
            <div className="banner">
                <img className='banner-icon' src={BannerIcon}></img>
                <p>Now live on XRPL Testnet.
                    <a href="https://zkml.gitbook.io" className='banner-start'> /Get started </a> now!
                </p>
            </div>
        </>
    )
}
export default Banner;