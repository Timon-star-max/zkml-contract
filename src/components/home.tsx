import './home.css';
import Logo from '../assets/svg/logo.svg'
import HomeEffect from "../assets/svgs/HomeEffect";
const Home = () => {
    return (
        <div className="">
            <div className="logo_effect">
                <div className="container-pulse">
                    <div className="box-pulse">
                        <div className="pulse">
                            <img src={Logo} className="heart" alt=""/>
                        </div>
                        <h1 className="intro_text">Introducing</h1>
                        <h1 className="intro_text"> Anonymous & Effortless ETH</h1>
                        <h1 className="intro_text"> Transfers on Goerli Network</h1>
                    </div>
                </div>
            </div>
            <div className="home_effect">
                <HomeEffect></HomeEffect>
            </div>
            <div className="home_start">
                <div className="outline-container">
                    <a href="https://zkml.docs.vercel.app" className="btn_start">Docs {">"}</a>
                </div>
            </div>
        </div>
    )
}
export default Home;