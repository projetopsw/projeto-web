export default function Cadastro() {
    return (
        <div className="container">
            <div className="logo-container">
                <img className="logo" src="assets/img/vaca-logo.png" alt="Logo da Vaca" />
                <h1>Junte-se ao rebanho!</h1>
            </div>

            <div className="login-container">
                <form className="login-form">
                    <label htmlFor="user-email">Email ou nome de boiadeiro</label>
                    <input id="user-email" type="email" />
                    <label htmlFor="user-password">Senha</label>
                    <input id="user-password" type="password" />
                    <button className="btn orange-btn">Entrar no pasto</button>
                </form>            
            </div>

            <div className="footer">
                <span className="lighter-text">Já é da fazenda?</span>
                <a href="login_usuario.html">Abra a porteira aqui</a>
            </div>
        </div>
    );
}