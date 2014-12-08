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


NAN_METHOD(WrappedRE2::Match) {
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

	StringPiece str(data, size);
	vector<StringPiece> groups;

	// actual work

	if (re2->global) {
		// global: collect all matches

		StringPiece match;
		size_t lastIndex = 0;

		while (re2->regexp.Match(str, lastIndex, size, RE2::UNANCHORED, &match, 1)) {
			groups.push_back(match);
			lastIndex = match.data() - data + match.size();
		}

		if (groups.empty()) {
			NanReturnNull();
		}
	} else {
		// non-global: just like exec()

		groups.resize(re2->regexp.NumberOfCapturingGroups() + 1);
		if (!re2->regexp.Match(str, re2->lastIndex, size, RE2::UNANCHORED, &groups[0], groups.size())) {
			NanReturnNull();
		}
	}

	// form a result

	Local<Array> result = NanNew<Array>();
	for (size_t i = 0, n = groups.size(); i < n; ++i) {
		const StringPiece& item = groups[i];
		result->Set(NanNew<Integer>(i), NanNew<String>(item.data(), item.size()));
	}

	if (!re2->global) {
		result->Set(NanNew("index"), NanNew<Integer>(groups[0].data() - data));
		result->Set(NanNew("input"), args[0]);
	}

	NanReturnValue(result);
}
