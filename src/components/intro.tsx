import './intro.css';
import IntroStealth from "../assets/svgs/IntroStealth";
import IntroEth from "../assets/svgs/IntroEth";
const Intro = () => {
    return (
        <div className="intro">
            <div className="intro_stealth">
                <IntroStealth></IntroStealth>
                <p className="intro_stealth_text">Safeguard Your Transactions with Untraceable Stealth Addresses</p>
            </div>
            <div className="intro_eth">
                <div className="img_eth"><IntroEth></IntroEth></div>
                <p className="intro_eth_text">Send And Receive ETH Privately</p>
            </div>
        </div>
    )
}
export default Intro;