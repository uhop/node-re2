#include "./util.h"

#include <node_buffer.h>


using v8::Local;
using v8::String;
using v8::Value;

using node::Buffer;


StrVal::StrVal(const Local<Value>& arg) : data(NULL), size(0), isBuffer(false) {
	if (Buffer::HasInstance(arg)) {
		isBuffer = true;
		size = Buffer::Length(arg);
		data = Buffer::Data(arg);
	} else {
		Local<String> t(arg->ToString());
		size = t->Utf8Length();
		buffer.resize(size + 1);
		data = &buffer[0];
		t->WriteUtf8(data);
	}
}
