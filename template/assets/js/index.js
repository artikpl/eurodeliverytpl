class TopForm {
    loaded(res) {
        this.form.find('.gross span').text(res.gross.toFixed(2).replace('.', ','));
        this.form.find('.net span').text(res.net.toFixed(2).replace('.', ','));
    }

    toShipment() {
        const type = this.inputs.filter('[name="parcel-type"]:checked').val();
        if (type !== this.prevType) {
            let dims = null;
            if (type === 'pallet') {
                dims = [120, 80, 60, 50];
            } else if (type === 'parcel') {
                dims = [30, 20, 10, 1];
            } else if (type === 'envelope') {
                dims = [30, 20, 2, 1];
            }
            this.inputs.filter('[name="parcels[0].length"]').val(dims[0]);
            this.inputs.filter('[name="parcels[0].width"]').val(dims[1]);
            this.inputs.filter('[name="parcels[0].height"]').val(dims[2]);
            this.inputs.filter('[name="parcels[0].weight"]').val(dims[3]);
            this.prevType = type;
        }
        return {
            parcels : [{
                type: {
                    code: type
                },
                nonstandard: this.inputs.filter('[name="parcels[0].nonstandard"]').val()>0,
                weight: {
                    value: this.inputs.filter('[name="parcels[0].weight"]').val()*1,
                    unit: {code:'kg'}
                },
                dimensions: {
                    length: {
                        value: this.inputs.filter('[name="parcels[0].length"]').val()*1,
                        unit: {code:'cm'}
                    },
                    width: {
                        value: this.inputs.filter('[name="parcels[0].width"]').val()*1,
                        unit: {code:'cm'}
                    },
                    height: {
                        value: this.inputs.filter('[name="parcels[0].height"]').val()*1,
                        unit: {code:'cm'}
                    },
                }
            }],
            addresses: {
                sender: {
                    country: {iso: this.inputs.filter('[name="sender.country"]').val()},
                    postcode: this.inputs.filter('[name="sender.postcode"]').val()
                },
                recipient: {
                    country: {iso: this.inputs.filter('[name="recipient.country"]').val()},
                    postcode: this.inputs.filter('[name="recipient.postcode"]').val()
                }
            }
        };
    }
    recount() {
        this.form.find('.gross span, .net span').text('');
        $.ajax({
            url: '/get-shipment-price',
            method: 'POST',
            data: JSON.stringify({
                shipment:this.toShipment()
            }),
            contentType: 'application/json',
            headers: {
                accept: 'application/json'
            },
            success:this.loaded.bind(this),
        });
    }
    init(options) {
        this.form = options.form;
        this.inputs = this.form.find(':input');
        this.prevType = this.inputs.filter('[name="parcel-type"]:checked').val();
        this.form.find(':input').change(this.recount.bind(this));
        this.form.find('[name=parcel-type][value=parcel]').prop('checked', true);
        this.recount();
        this.form.show();
        this.form.submit(this.proceed.bind(this));
    }

    proceed(e){
        e.preventDefault();
        $.ajax({
            url: '/proceed-shipment',
            method: 'POST',
            data: JSON.stringify({
                shipment:this.toShipment()
            }),
            contentType: 'application/json',
            headers: {
                accept: 'application/json'
            },
            success:function(){
                window.top.location.href = '/przesylki/nowa';
            }
        });
        return false;
    }
}
const topForm = new TopForm();


$(document).ready(function() {
    topForm.init({
        form: $('form[name=topForm]')
    });
});