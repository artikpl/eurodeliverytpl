class App{
    init() {
        //$('button[name="responsive-menu"]').click(this.toggleMenu.bind(this));
        $('[data-toggle="tooltip"]').tooltip({
            html: true
        });
        this.socket  = io(':3000/');
        this.socket.on("connect", this.socketConnected.bind(this));
        this.socket.on('hello',this.socketHello.bind(this));
    }

    socketConnected(a,b,c)
    {
        console.log('socketConnected', this.socket.id,a,b,c);
    }

    socketHello(a,b,c) {
        console.log('socketHello', a, b, c);
    }

    toggleMenu() {
        const menu = $('div.responsive-menu');
        if (menu.is(':visible')) {
            menu.hide();
        } else {
            menu.show();
        }
        //$('.menu').toggleClass('active');
    }
}


const app = new App();
$(document).ready(function () {
    app.init();
});