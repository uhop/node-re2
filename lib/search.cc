#include "./wrapped_re2.h"

#include <vector>

#include <node_buffer.h>


using std::vector;

using v8::Integer;
using v8::Local;
using v8::String;

using node::Buffer;


NAN_METHOD(WrappedRE2::Search) {
	NanScope();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		NanReturnValue(NanNew(-1));
	}

	vector<char> buffer;

	char*  data;
	size_t size;
	bool   isBuffer = false;

	if (args[0]->IsString()) {
		Local<String> t(args[0]->ToString());
		buffer.resize(t->Utf8Length() + 1);
		t->WriteUtf8(&buffer[0]);
		size = buffer.size() - 1;
		data = &buffer[0];
	} else if (Buffer::HasInstance(args[0])) {
		isBuffer = true;
		size = Buffer::Length(args[0]);
		data = Buffer::Data(args[0]);
	} else {
		NanReturnValue(NanNew(-1));
	}

	// actual work

	StringPiece match;

	if (re2->regexp.Match(StringPiece(data, size), 0, size, RE2::UNANCHORED, &match, 1)) {
		NanReturnValue(NanNew<Integer>(isBuffer ? match.data() - data :
			getUtf16Length(data, match.data())));
	}

	NanReturnValue(NanNew(-1));
}
