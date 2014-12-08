#include "./wrapped_re2.h"

#include <memory>

#include <node_buffer.h>


using std::auto_ptr;

using node::Buffer;


NAN_METHOD(WrappedRE2::Test) {
	NanScope();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		NanReturnValue(NanNew(false));
	}

	auto_ptr<NanUtf8String> buffer;

	char*  data;
	size_t size;
	if (args[0]->IsString()){
		buffer.reset(new NanUtf8String(args[0]));
		data = **buffer;
		size = len(*buffer);
	} else if (Buffer::HasInstance(args[0])) {
		data = Buffer::Data(args[0]);
		size = Buffer::Length(args[0]);
	} else {
		NanReturnValue(NanNew(false));
	}

	// actual work

	if (re2->lastIndex > size) {
		re2->lastIndex = 0;
		NanReturnValue(NanNew(false));
	}

	NanReturnValue(NanNew(
		re2->regexp.Match(StringPiece(data, size), re2->lastIndex, size, RE2::UNANCHORED, NULL, 0)));
}
