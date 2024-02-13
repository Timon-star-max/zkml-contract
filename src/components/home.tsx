import { useNetwork } from 'wagmi';
import Logo from '../assets/svg/logo.svg'
import HomeEffect from "../assets/svgs/HomeEffect";
import './home.css';

const Home = () => {
    const { chain } = useNetwork();
    
    return (
        <div className="">
            <div className="logo_effect">
                <div className="container-pulse">
                    <div className="box-pulse">
                        <div className="pulse">
                            <img src={Logo} className="heart" alt=""/>
                        </div>
                        <h1 className="intro_text">Introducing</h1>
                        <h1 className="intro_text"> Anonymous & Effortless {chain?.nativeCurrency.symbol || 'Crypto'}</h1>
                        <h1 className="intro_text"> Transfers on {chain?.name.split(' ')[0] || 'any EVM'} Network</h1>
                    </div>
                </div>
            </div>
            <div className="home_effect">
                <HomeEffect></HomeEffect>
            </div>
            <div className="home_start">
                <div className="outline-container">
                    <a href="https://zkml.gitbook.io" className="btn_start">Docs {">"}</a>
                </div>
            </div>
        </div>
    )
}
export default Home;