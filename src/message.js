/** @jsx React.DOM */

var fieldComponents = {},
    Message,
    LONG_REG = /64$/,
    INT_REG = /(INT|FIXED)/,
    UINT_REG = /(UINT|[^S]FIXED)/;

function fieldData(field) {
  var data = {
        id: field.getf('number'),
        name: field.getf('name'),
        doc: field.getf('doc')
      },
      fieldOpts = field.getf('options'),
      fenderOpts;

  if(fieldOpts && (fenderOpts = fieldOpts.getf('fender_field', 'fender.v1'))) {
    var opts = fenderOpts.asJSON();
    Object.keys(opts).forEach(function(key) {
      data[key] = opts[key];
    });
  }

  return data;
}

function wrapField(name, isRequired, child, remover, errorComponent, isError) {
  var removeButton;
  if(remover) {
    removeButton = ( <button className='remover' onClick={remover}>X</button> );
  } else {
    removeButton = ( <span /> );
  }

  return (
    <div className={"proto-field " + isError} data-error={errorComponent}>
      {removeButton}
      <label>{requiredMarker(isRequired)} {name}</label>
      {child}
    </div>
  );
}

function requiredMarker(isRequired) {
  return (isRequired ? ( <span className="required">*</span> ) : ( <span></span> ) );
}

var StringField = React.createClass({
  getInitialState: function() {
    return { textarea: !!this.props.field.displayAsTextArea };
  },
  provideValue: function() {
    var val = this.refs[this.props.field.getf('number')].getDOMNode().value;
    val = this.props.field.coerce({}, val)
    if(this.props.setMessageValue) this.props.setMessageValue(val);
  },
  render: function() {
    var field = this.props.field,
        data = fieldData(field),
        message = this.props.message,
        value = this.props.value,
        required = !!(field.required || data.present),
        child;

    if(this.state.textarea) {
      child = ( <textarea ref={data.id} placeholder={data.name} required={required} onChange={this.provideValue}>{value}</textarea> );
    } else {
      child = ( <input type="text" ref={data.id} placeholder={data.name} value={value} required={required} onChange={this.provideValue}/> );
    }
    return child;
  }
});

var NumericField = React.createClass({
  getInitialState: function() {
    return { value: this.props.value && this.props.value.toString() };
  },
  storeState: function() {
    var val = this.refs[this.props.field.getf('number')].getDOMNode().value;
    this.setState( { value: val } );
  },
  provideValue: function() {
    if(this.props.setMessageValue) this.props.setMessageValue(this.props.field.coerce({}, this.state.value));
  },
  render: function() {
    var field = this.props.field,
        data = fieldData(field),
        value = this.state.value,
        type = field.fieldType,
        required = !!(field.required || data.present),
        isLong = LONG_REG.test(type),
        isInt = INT_REG.test(type),
        isUint = UINT_REG.test(type),
        opts = {
          type: "number",
          ref: data.id
        };

    if(data.hasOwnProperty('max')) opts.max = data.max;
    if(data.hasOwnProperty('min')) opts.min = data.min;
    if(value && value.toString) value = value.toString(); // handle longs

    opts.value = value;
    if(isUint && !data.min) opts.min = 0;

    if(isInt) {
      opts.step = 1;
    } else {
      opts.step = "any";
    }

    opts.onBlur = this.provideValue;
    opts.onChange = this.storeState;

    return new React.DOM.input(opts);
  }
});

var EnumField = React.createClass({
  provideValue: function() {
    var val = this.refs[this.props.field.getf('number')].getDOMNode().value;
    val = this.props.field.coerce({}, val);
    if(this.props.setMessageValue) this.props.setMessageValue(val);
  },
  componentDidMount: function() {
    // Have to take into account what happens when the field is required but no default is supplied
    var val = this.refs[this.props.field.getf('number')].getDOMNode().value,
        enumValue = this.props.value && this.props.value.name;

    if(val != enumValue) this.provideValue();
  },
  render: function() {
    var field = this.props.field,
        data = fieldData(field),
        value = this.props.value,
        required = !!(field.required || data.present),
        fullName = field.concrete.fullName,
        names = Object.keys(field.concrete.v),
        options = [];

    if(value) value = value.name || value;
    if(!required) options.push( ( <option key="not-set" /> ));

    names.forEach(function(name) {
      var key = fullName + '.' + name;
      options.push( ( <option value={name} key={name}>{name}</option> ) );
    });

    return ( <select ref={data.id} value={value} onChange={this.provideValue}>{options}</select> );
  }
});

var BoolField = React.createClass({
  provideValue: function() {
    var val = this.refs[this.props.field.getf('number')].getDOMNode().checked;
    val = this.props.field.coerce({}, val)
    if(this.props.setMessageValue) this.props.setMessageValue(val);
  },
  render: function() {
    var field = this.props.field,
        data = fieldData(field),
        value = !!this.props.value,
        required = !!(field.required || data.present);

    return (
      <input ref={data.id} type="checkbox" value="true" checked={value} onChange={this.provideValue} />
    );
  }
});

var MessageField = React.createClass({
  getInitialState: function() {
    return { msg: this.props.value };
  },
  createNew: function() {
    var field = this.props.field,
        concrete = field.descriptor.concrete,
        msg = new concrete();

    if(this.props.setMessageValue) this.props.setMessageValue(msg);
    this.setState({msg: msg});
  },
  render: function() {
    var field = this.props.field,
        data = fieldData(field),
        msg = this.state.msg,
        required = !!(field.required || data.present);

    if(!msg) {
      return ( <span onClick={this.createNew}>+</span> );
    } else {
      return new Message({ message: msg, remover: this.props.remover} );
    }
  }
});

var BytesField = React.createClass({
  render: function() {
    return ( <span className="not-supported">Bytes fields not supported</span> );
  }
});

[
  "TYPE_DOUBLE", "TYPE_FLOAT", "TYPE_INT32", "TYPE_INT64", "TYPE_UINT32", "TYPE_UINT64", "TYPE_FIXED32",
  "TYPE_FIXED64", "TYPE_SFIXED32", "TYPE_SFIXED64", "TYPE_SINT32", "TYPE_SINT64"
].forEach(function(type) {
  fieldComponents[type] = NumericField;
});

fieldComponents.TYPE_STRING = StringField;
fieldComponents.TYPE_ENUM = EnumField;
fieldComponents.TYPE_BOOL = BoolField;
fieldComponents.TYPE_MESSAGE = MessageField;
fieldComponents.TYPE_BYTES = BytesField;

var SingleField = React.createClass({
  render: function() {
    if(!this.props.field) return (<span />);
    var data = fieldData(this.props.field),
        required = !!(data.required || data.present),
        child, setMessageValue,
        error = this.props.error,
        isError, errorComponent;

    setMessageValue = function(val) {
      this.props.message.setf(val, this.props.field.getf('number'));
      this.setState({ time: new Date().valueOf() });
    }.bind(this);

    if(error && error.error_types && error.error_types.length) {
      errorComponent = error.error_types.join(',');
      isError = "validation-error";
    } else {
      errorComponent = null;
      isError = '';
    }

    child = new fieldComponents[this.props.field.fieldType]( {
      field: this.props.field,
      value: this.props.message.getf(this.props.field.getf('number')),
      message: this.props.message,
      setMessageValue: setMessageValue,
      error: this.props.error
    });

    return wrapField(data.name, required, child, this.props.remover, errorComponent, isError);
  }
});

var RepeatedField = React.createClass({
  addNew: function() {
    var field = this.props.field,
        message = this.props.message,
        children = this.props.value,
        value;

    if(field.fieldType == "TYPE_MESSAGE") value = new field.descriptor.concrete();

    value = value || '';
    value.key = new Date().valueOf();
    children.push(value);

    this.setState({ time: new Date().valueOf() });
  },
  render: function() {
    var field = this.props.field,
        data = fieldData(field),
        fieldComponent = fieldComponents[field.fieldType],
        repeated = this.props.field.repeated,
        values = this.props.value,
        required = !!(field.required || data.preset),
        self = this,
        children = [],
        error = this.props.error,
        isError, errorComponent;

    values.forEach(function(val, i) {
      var remover = function() {
        var oldState = this.props.value;

        oldState.splice(i, 1);
        this.setState({time: new Date().valueOf()});
      }.bind(this);

      var setValue = function(val) {
        var oldState = this.props.value;
        oldState[i] = val;
        this.setState({time: new Date().valueOf()});
      }.bind(this);

      children.push(
        new fieldComponent({
          field: field,
          value: val,
          remover: remover,
          key: val.key,
          setMessageValue: setValue
        })
      );
    }.bind(this));

    if(error && error.error_types && error.error_types.length) {
      errorComponent = error.error_types.join(',');
      isError = "validation-error";
    } else {
      errorComponent = null;
      isError = '';
    }

    return (
      <div className={ "proto-field " + (isError || '')  } data-errors={errorComponent} >
        <label>{requiredMarker(required)} {data.name} <span className="add-new" onClick={this.addNew}>+</span></label>
        <fieldset className="proto-field">
          {children}
        </fieldset>
      </div>
    );
  }
});

var Field = React.createClass({
  render: function() {
    if(!this.props.field) return (<span />);
    var data = fieldData(this.props.field),
        repeated = this.props.field.repeated,
        value = this.props.message.getf(data.id);

    if(repeated) {
      return new RepeatedField({field: this.props.field, value: value, remover: this.props.remover, message: this.props.message, error: this.props.error});
    } else {
      return new SingleField({field: this.props.field, value: value, remover: this.props.remover, message: this.props.message, error: this.props.error});
    }
  }
});

var Message = React.createClass({
  render: function() {
    var message = this.props.message;
    if(!message) return (<div className="Message">No Class</div>);
    if(!message.isMessage()) return (<div className="Message">Not a message</div>);

    var children = [],
        fieldErrors = {};

    ((this.props.errors && this.props.errors.errors) || []).forEach(function(error) {
      var errorKey = [error.field.name, error.field.package].join("#");
      fieldErrors[errorKey] = error;
    });

    message.constructor.orderedFields.forEach(function(field, i) {
      var fieldName = field.getf('name'),
          fieldId = field.getf('number'),
          key = message.constructor.fullName + fieldName + fieldId,
          error = fieldErrors[[fieldName, field.package].join('#')];

      children.push(new Field({ field: field, message: message, key: key, error: error}));
    });

    var removeButton;
    if(this.props.remover) {
      removeButton = ( <button className='remover' onClick={this.props.remover}>X</button> );
    } else {
      removeButton = ( <span /> );
    }

    return (
      <fieldset className="Message">
        {removeButton}
        {children}
      </fieldset>
    );
  }
});

var MessageForm = React.createClass({
  getInitialState: function() {
    return { errors: undefined };
  },
  handleSubmit: function($event) {
    $event.preventDefault();
    var validation;
    if(this.props.message.fenderValidate) {
      validation = this.props.message.fenderValidate().asJSON();
      if(!validation.valid) {
        this.setState({errors: validation});
        if(this.props.onSubmit) this.props.onSubmit(validation);
        return;
      } else {
        this.setState({errors: undefined});
      }
    }

    if(this.props.onSubmit) this.props.onSubmit(null, this.props.message);
    return false;
  },
  render: function() {
    var msg = this.props.message;

    return (
      <form onSubmit={this.handleSubmit} className="messageForm">
        <Message message={msg} errors={this.state.errors} />
        <input type="submit" value="Go!" />
      </form>
    );
  }
});

if(typeof window != 'undefined') {
  window.Message = Message;
} else if( typeof module != 'undefined') {
  module.exports = Message;
}

