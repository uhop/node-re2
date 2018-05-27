#include "./util.h"

#include <node_buffer.h>


using v8::Local;
using v8::MaybeLocal;
using v8::String;
using v8::Value;
using v8::Isolate;


StrVal::StrVal(const Local<Value>& arg) : data(NULL), size(0), isBuffer(false) {
	if (node::Buffer::HasInstance(arg)) {
		isBuffer = true;
		size = length = node::Buffer::Length(arg);
		data = node::Buffer::Data(arg);
	} else {
		MaybeLocal<String> t(arg->ToString(Isolate::GetCurrent()->GetCurrentContext()));
		if (!t.IsEmpty()) {
			Local<String> s = t.ToLocalChecked();
			length = s->Length();
			size = s->Utf8Length();
			buffer.resize(size + 1);
			data = &buffer[0];
			s->WriteUtf8(data);
		}
	}
}
