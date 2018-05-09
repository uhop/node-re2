#include "./util.h"

#include <node_buffer.h>


using v8::Local;
using v8::String;
using v8::Value;


StrVal::StrVal(const Local<Value>& arg, size_t startIndexHint) : data(NULL), size(0), startIndex(0), isBuffer(false), original() {
	if (node::Buffer::HasInstance(arg)) {
		isBuffer = true;
		size = node::Buffer::Length(arg);
		data = node::Buffer::Data(arg);
	} else {
		ToStringHelper< Local<String> > mt(arg);
		if (!mt.IsEmpty()) {
			const Local<String>& t = mt.Unwrap();
			if (startIndexHint) {
				startIndex = startIndexHint;
				String::Value s(t);
				original = Nan::New(*s + startIndex, s.length() - startIndex);
			} else {
				original = t;
			}
			Local<String> t2 = original.ToLocalChecked();
			size = t2->Utf8Length();
			buffer.resize(size + 1);
			data = &buffer[0];
			t2->WriteUtf8(data);
		}
	}
}


Utf8LastIndexGuard::Utf8LastIndexGuard(WrappedRE2* re2, StrVal& input) : re2_(re2), input_(input) {
	if (!re2 || (!re2->global && !re2->sticky) || input.isBuffer) {
		re2_ = NULL;
	} else {
		if (!input.original.IsEmpty()) {
			String::Value inputValue(input.original.ToLocalChecked());
			re2->lastIndex -= input.startIndex;
			re2->lastIndex = getUtf8Length(*inputValue + input.startIndex, *inputValue + input.startIndex + ((re2->lastIndex < inputValue.length()) ? re2->lastIndex : inputValue.length()));
		}
	}
}


Utf8LastIndexGuard::~Utf8LastIndexGuard() {
	if (re2_) {
		re2_->lastIndex = getUtf16Length(input_.data, input_.data + ((re2_->lastIndex < input_.size) ? re2_->lastIndex : input_.size)) + input_.startIndex;
	}
}
