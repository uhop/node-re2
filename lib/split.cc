#include "./wrapped_re2.h"

#include <algorithm>
#include <limits>
#include <memory>
#include <vector>

#include <node_buffer.h>


using std::auto_ptr;
using std::min;
using std::numeric_limits;
using std::vector;

using v8::Array;
using v8::Integer;
using v8::Local;
using v8::String;

using node::Buffer;


NAN_METHOD(WrappedRE2::Split) {
	NanScope();

	Local<Array> result = NanNew<Array>();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		result->Set(NanNew(0), args[0]);
		NanReturnValue(result);
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
		result->Set(NanNew(0), args[0]);
		NanReturnValue(result);
	}

	StringPiece str(data, size);

	size_t limit = numeric_limits<size_t>::max();
	if (args.Length() > 1 && args[1]->IsNumber()) {
		size_t lim = args[1]->NumberValue();
		if (lim > 0) {
			limit = lim;
		}
	}


	// actual work

	vector<StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1), pieces;
	const StringPiece& match = groups[0];
	size_t lastIndex = 0;

	while (lastIndex < size && re2->regexp.Match(str, lastIndex, size, RE2::UNANCHORED, &groups[0], groups.size())) {
		if (match.size()) {
			if (match.data() == data || match.data() - data > lastIndex) {
				pieces.push_back(StringPiece(data + lastIndex, match.data() - data - lastIndex));
			}
			lastIndex = match.data() - data + match.size();
			pieces.insert(pieces.end(), groups.begin() + 1, groups.end());
		} else {
			pieces.push_back(StringPiece(data + lastIndex, 1));
			++lastIndex;
		}
		if (pieces.size() >= limit) {
			break;
		}
	}
	if (pieces.size() < limit && (lastIndex < size || (lastIndex == size && match.size()))) {
		pieces.push_back(StringPiece(data + lastIndex, size - lastIndex));
	}

	if (pieces.empty()) {
		result->Set(NanNew(0), args[0]);
		NanReturnValue(result);
	}

	// form a result

	for (size_t i = 0, n = min(pieces.size(), limit); i < n; ++i) {
		const StringPiece& item = pieces[i];
		result->Set(NanNew<Integer>(i), NanNew<String>(item.data(), item.size()));
	}

	NanReturnValue(result);
}
