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


Utf8LastIndexGuard::Utf8LastIndexGuard(WrappedRE2* re2, const Local<Value>& utf16Input, const StrVal& utf8Input) : re2_(re2), utf8Input_(utf8Input) {
	if (!re2 || (!re2->global && !re2->sticky) || utf8Input.isBuffer) {
		re2_ = NULL;
	} else {
		String::Value inputValue(utf16Input->ToString());
		re2->lastIndex = getUtf8Length(*inputValue, *inputValue + ((re2->lastIndex < inputValue.length()) ? re2->lastIndex : inputValue.length()));
	}
}


Utf8LastIndexGuard::~Utf8LastIndexGuard() {
	if (re2_) {
		re2_->lastIndex = getUtf16Length(utf8Input_.data, utf8Input_.data + ((re2_->lastIndex < utf8Input_.size) ? re2_->lastIndex : utf8Input_.size));
	}
}
