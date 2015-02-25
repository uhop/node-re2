#include "./util.h"

#include <node_buffer.h>


using v8::Local;
using v8::String;
using v8::Value;


StrVal::StrVal(const Local<Value>& arg) : data(NULL), size(0), isBuffer(false) {
	if (node::Buffer::HasInstance(arg)) {
		isBuffer = true;
		size = node::Buffer::Length(arg);
		data = node::Buffer::Data(arg);
	} else {
		Local<String> t(arg->ToString());
		size = t->Utf8Length();
		buffer.resize(size + 1);
		data = &buffer[0];
		t->WriteUtf8(data);
	}
}
