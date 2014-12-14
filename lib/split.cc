#include "./wrapped_re2.h"

#include <algorithm>
#include <limits>
#include <vector>

#include <node_buffer.h>


using std::min;
using std::numeric_limits;
using std::vector;

using v8::Array;
using v8::Local;
using v8::String;

using node::Buffer;


NAN_METHOD(WrappedRE2::Split) {
	NanScope();

	Local<Array> result = NanNew<Array>();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		result->Set(0, args[0]);
		NanReturnValue(result);
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
		result->Set(0, args[0]);
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
			size_t sym_size = getUtf8CharSize(data[lastIndex]);
			pieces.push_back(StringPiece(data + lastIndex, sym_size));
			lastIndex += sym_size;
		}
		if (pieces.size() >= limit) {
			break;
		}
	}
	if (pieces.size() < limit && (lastIndex < size || (lastIndex == size && match.size()))) {
		pieces.push_back(StringPiece(data + lastIndex, size - lastIndex));
	}

	if (pieces.empty()) {
		result->Set(0, args[0]);
		NanReturnValue(result);
	}

	// form a result

	if (isBuffer) {
		for (size_t i = 0, n = min(pieces.size(), limit); i < n; ++i) {
			const StringPiece& item = pieces[i];
			result->Set(i, NanNewBufferHandle(item.data(), item.size()));
		}
	} else {
		for (size_t i = 0, n = min(pieces.size(), limit); i < n; ++i) {
			const StringPiece& item = pieces[i];
			result->Set(i, NanNew<String>(item.data(), item.size()));
		}
	}

	NanReturnValue(result);
}
