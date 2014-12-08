#include "./wrapped_re2.h"

#include <memory>
#include <vector>

#include <node_buffer.h>


using std::auto_ptr;
using std::vector;

using v8::Array;
using v8::Integer;
using v8::Local;
using v8::String;

using node::Buffer;


NAN_METHOD(WrappedRE2::Exec) {
	NanScope();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		NanReturnNull();
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
		NanReturnNull();
	}

	// actual work

	if (re2->lastIndex > size) {
		re2->lastIndex = 0;
		NanReturnNull();
	}

	vector<StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1);

	if (!re2->regexp.Match(StringPiece(data, size), re2->lastIndex, size, RE2::UNANCHORED, &groups[0], groups.size())) {
		NanReturnNull();
	}

	// form a result

	Local<Array> result = NanNew<Array>();
	for (size_t i = 0, n = groups.size(); i < n; ++i) {
		const StringPiece& item = groups[i];
		result->Set(NanNew<Integer>(i), NanNew<String>(item.data(), item.size()));
	}
	result->Set(NanNew<String>("index"), NanNew<Integer>(groups[0].data() - data));
	result->Set(NanNew<String>("input"), args[0]);

	if (re2->global) {
		re2->lastIndex = groups[0].data() - data + groups[0].size();
	}

	NanReturnValue(result);
}
