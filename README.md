# React Fender

Provides a simple form builder for protocol buffer messages via React.

## Usage

You need to have react.js and jQuery on your page, and either use Protob or Fender to fetch a proto bundle.


    Fender = require('fender');
    Fender.fetchProtos("http://example.com/proto-bundle.json")
    .then(function() {

      // Create an on-submit handler
      function onSubmit(err, value) {
        if(err) {
          console.error(err);
        } else {
          console.log(value.asJSON());
        }
      }

      var Klass = Fender.Protob.registry.lookup('my.Message');

      React.renderComponent(
        new MessageForm({message: new Klass(), onSubmit: onSubmit }),
        document.getElementById('content')
      );

    });


