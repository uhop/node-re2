#include "./wrapped_re2.h"

#include <memory>

#include <node_buffer.h>


using std::auto_ptr;

using v8::Integer;

using node::Buffer;


NAN_METHOD(WrappedRE2::Search) {
	NanScope();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		NanReturnValue(NanNew(-1));
	}

	auto_ptr<NanUtf8String> buffer;

	char*  data;
	size_t size;
	if (args[0]->IsString()) {
		buffer.reset(new NanUtf8String(args[0]));
		data = **buffer;
		size = len(*buffer);
	} else if (Buffer::HasInstance(args[0])) {
		data = Buffer::Data(args[0]);
		size = Buffer::Length(args[0]);
	} else {
		NanReturnValue(NanNew(-1));
	}

	// actual work

	StringPiece match;

	if (re2->regexp.Match(StringPiece(data, size), 0, size, RE2::UNANCHORED, &match, 1)) {
		NanReturnValue(NanNew<Integer>(match.data() - data));
	}

	NanReturnValue(NanNew(-1));
}
