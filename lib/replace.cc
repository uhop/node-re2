#include "./wrapped_re2.h"

#include <algorithm>
#include <memory>
#include <string>
#include <vector>

inline int getMaxSubmatch(
	const char *data,
	size_t size,
	const std::map<std::string, int> &namedGroups)
{
	int maxSubmatch = 0, index, index2;
	const char *nameBegin;
	const char *nameEnd;
	for (size_t i = 0; i < size;)
	{
		char ch = data[i];
		if (ch == '$')
		{
			if (i + 1 < size)
			{
				ch = data[i + 1];
				switch (ch)
				{
				case '$':
				case '&':
				case '`':
				case '\'':
					i += 2;
					continue;
				case '0':
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
					index = ch - '0';
					if (i + 2 < size)
					{
						ch = data[i + 2];
						if ('0' <= ch && ch <= '9')
						{
							index2 = index * 10 + (ch - '0');
							if (maxSubmatch < index2)
								maxSubmatch = index2;
							i += 3;
							continue;
						}
					}
					if (maxSubmatch < index)
						maxSubmatch = index;
					i += 2;
					continue;
				case '<':
					nameBegin = data + i + 2;
					nameEnd = (const char *)memchr(nameBegin, '>', size - i - 2);
					if (nameEnd)
					{
						std::string name(nameBegin, nameEnd - nameBegin);
						auto group = namedGroups.find(name);
						if (group != namedGroups.end())
						{
							index = group->second;
							if (maxSubmatch < index)
								maxSubmatch = index;
						}
						i = nameEnd + 1 - data;
					}
					else
					{
						i += 2;
					}
					continue;
				}
			}
			++i;
			continue;
		}
		i += getUtf8CharSize(ch);
	}
	return maxSubmatch;
}

// V8 refuses UTF-8 input over kMaxLength bytes, even if its UTF-16 length would fit.
// A Buffer has no practical limit: twice the subject keeps large inputs working.
inline size_t getResultLimit(const StrVal &replacee)
{
	const size_t limit = v8::String::kMaxLength;
	return replacee.isBuffer ? std::max(limit, replacee.size * 2) : limit;
}

class StringSink
{
public:
	static constexpr bool isDryRun = false;

	explicit StringSink(std::string &text) : text(text) {}

	void append(char ch) { text += ch; }
	void append(const re2::StringPiece &piece) { text.append(piece.data(), piece.size()); }
	bool isFull() const { return false; }

private:
	std::string &text;
};

class SizeSink
{
public:
	static constexpr bool isDryRun = true;

	explicit SizeSink(const StrVal &replacee) : limit(getResultLimit(replacee)) {}

	void append(char) { ++bytes; }
	void append(const re2::StringPiece &piece) { bytes += piece.size(); }
	bool isFull() const { return bytes > limit; }
	size_t getBytes() const { return bytes; }

private:
	const size_t limit;
	size_t bytes = 0;
};

// Only $' and $` can repeat the whole subject for every match.
static bool canExceedLimit(const StrVal &replacee, const char *replacer, size_t replacer_size)
{
	size_t subjectTokens = 0;
	for (size_t i = 0; i + 1 < replacer_size; ++i)
	{
		if (replacer[i] == '$' && (replacer[i + 1] == '\'' || replacer[i + 1] == '`'))
		{
			++subjectTokens;
		}
	}
	// double: the product can overflow size_t, and only its magnitude matters
	const double size = replacee.size, matches = size + 1;
	return size + matches * (2.0 * replacer_size + subjectTokens * size) > getResultLimit(replacee);
}

template <typename Sink>
inline void expandTemplate(
	Sink &result,
	const char *data,
	size_t size,
	const std::vector<re2::StringPiece> &groups,
	const re2::StringPiece &str,
	const std::map<std::string, int> &namedGroups)
{
	size_t index, index2;
	const char *nameBegin;
	const char *nameEnd;
	for (size_t i = 0; i < size;)
	{
		char ch = data[i];
		if (ch == '$')
		{
			if (i + 1 < size)
			{
				ch = data[i + 1];
				switch (ch)
				{
				case '$':
					result.append(ch);
					i += 2;
					continue;
				case '&':
					result.append(groups[0]);
					i += 2;
					continue;
				case '`':
					result.append(re2::StringPiece(str.data(), groups[0].data() - str.data()));
					i += 2;
					continue;
				case '\'':
					result.append(re2::StringPiece(groups[0].data() + groups[0].size(),
												   str.data() + str.size() - groups[0].data() - groups[0].size()));
					i += 2;
					continue;
				case '0':
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
					index = ch - '0';
					if (i + 2 < size)
					{
						ch = data[i + 2];
						if ('0' <= ch && ch <= '9')
						{
							i += 3;
							index2 = index * 10 + (ch - '0');
							if (index2 && index2 < groups.size())
							{
								result.append(groups[index2]);
								continue;
							}
							else if (index && index < groups.size())
							{
								result.append(groups[index]);
								result.append(ch);
								continue;
							}
							result.append('$');
							result.append(static_cast<char>('0' + index));
							result.append(ch);
							continue;
						}
						ch = '0' + index;
					}
					i += 2;
					if (index && index < groups.size())
					{
						result.append(groups[index]);
						continue;
					}
					result.append('$');
					result.append(ch);
					continue;
				case '<':
					if (!namedGroups.empty())
					{
						nameBegin = data + i + 2;
						nameEnd = (const char *)memchr(nameBegin, '>', size - i - 2);
						if (nameEnd)
						{
							std::string name(nameBegin, nameEnd - nameBegin);
							auto group = namedGroups.find(name);
							if (group != namedGroups.end())
							{
								index = group->second;
								result.append(groups[index]);
							}
							i = nameEnd + 1 - data;
						}
						else
						{
							result.append("$<");
							i += 2;
						}
					}
					else
					{
						result.append("$<");
						i += 2;
					}
					continue;
				}
			}
			result.append('$');
			++i;
			continue;
		}
		size_t sym_size = getUtf8CharSize(ch, size - i);
		result.append(re2::StringPiece(data + i, sym_size));
		i += sym_size;
	}
}

template <typename Sink>
static void replaceAll(
	Sink &result,
	WrappedRE2 *re2,
	const StrVal &replacee,
	const char *replacer,
	size_t replacer_size)
{
	const re2::StringPiece str = replacee;
	const char *data = str.data();
	size_t size = str.size();

	const auto &namedGroups = re2->regexp.NamedCapturingGroups();

	std::vector<re2::StringPiece> groups(std::min(re2->regexp.NumberOfCapturingGroups(), getMaxSubmatch(replacer, replacer_size, namedGroups)) + 1);
	const auto &match = groups[0];

	size_t byteIndex = 0;
	auto anchor = re2::RE2::UNANCHORED;

	if (re2->sticky)
	{
		if (!re2->global)
			byteIndex = replacee.byteIndex;
		anchor = re2::RE2::ANCHOR_START;
	}

	if (byteIndex)
	{
		result.append(re2::StringPiece(data, byteIndex));
	}

	bool noMatch = true;
	while (byteIndex <= size && re2->regexp.Match(str, byteIndex, size, anchor, &groups[0], groups.size()))
	{
		noMatch = false;
		auto offset = match.data() - data;
		if (!Sink::isDryRun && !re2->global && re2->sticky)
		{
			re2->lastIndex +=
				replacee.isBuffer ? offset + match.size() - byteIndex : toUtf16Index(replacee.isAscii, data + byteIndex, match.data() + match.size());
		}
		if (match.data() == data || offset > static_cast<long>(byteIndex))
		{
			result.append(re2::StringPiece(data + byteIndex, offset - byteIndex));
		}
		expandTemplate(result, replacer, replacer_size, groups, str, namedGroups);
		if (result.isFull())
		{
			return;
		}
		if (match.size())
		{
			byteIndex = offset + match.size();
		}
		else if ((size_t)offset < size)
		{
			auto sym_size = getUtf8CharSize(data[offset], size - (size_t)offset);
			result.append(re2::StringPiece(data + offset, sym_size));
			byteIndex = offset + sym_size;
		}
		else
		{
			byteIndex = size;
			break;
		}
		if (!re2->global)
		{
			break;
		}
	}
	if (byteIndex < size)
	{
		result.append(re2::StringPiece(data + byteIndex, size - byteIndex));
	}

	if (Sink::isDryRun)
	{
		return;
	}

	if (re2->global)
	{
		re2->lastIndex = 0;
	}
	else if (re2->sticky)
	{
		if (noMatch)
			re2->lastIndex = 0;
	}
}

static bool replace(
	WrappedRE2 *re2,
	const StrVal &replacee,
	const char *replacer,
	size_t replacer_size,
	std::string &result)
{
	if (canExceedLimit(replacee, replacer, replacer_size))
	{
		SizeSink size(replacee);
		replaceAll(size, re2, replacee, replacer, replacer_size);
		if (size.isFull())
		{
			Nan::ThrowRangeError("Invalid string length");
			return false;
		}
		result.reserve(size.getBytes());
	}
	StringSink sink(result);
	replaceAll(sink, re2, replacee, replacer, replacer_size);
	return true;
}

inline Nan::Maybe<std::string> replace(
	const Nan::Callback *replacer,
	const std::vector<re2::StringPiece> &groups,
	const re2::StringPiece &str,
	const v8::Local<v8::Value> &input,
	bool useBuffers,
	bool isAscii,
	const std::map<std::string, int> &namedGroups)
{
	std::vector<v8::Local<v8::Value>> argv;

	auto context = Nan::GetCurrentContext();

	if (useBuffers)
	{
		for (size_t i = 0, n = groups.size(); i < n; ++i)
		{
			const auto &item = groups[i];
			const auto data = item.data();
			if (data)
			{
				auto buffer = Nan::CopyBuffer(data, item.size());
				if (buffer.IsEmpty())
				{
					Nan::ThrowRangeError("Invalid string length");
					return Nan::Nothing<std::string>();
				}
				argv.push_back(buffer.ToLocalChecked());
			}
			else
			{
				argv.push_back(Nan::Undefined());
			}
		}
		argv.push_back(Nan::New(static_cast<int>(groups[0].data() - str.data())));
	}
	else
	{
		for (size_t i = 0, n = groups.size(); i < n; ++i)
		{
			const auto &item = groups[i];
			const auto data = item.data();
			if (data)
			{
				auto text = Nan::New(data, item.size());
				if (text.IsEmpty())
				{
					Nan::ThrowRangeError("Invalid string length");
					return Nan::Nothing<std::string>();
				}
				argv.push_back(text.ToLocalChecked());
			}
			else
			{
				argv.push_back(Nan::Undefined());
			}
		}
		argv.push_back(Nan::New(static_cast<int>(toUtf16Index(isAscii, str.data(), groups[0].data()))));
	}
	argv.push_back(input);

	if (!namedGroups.empty())
	{
		auto groups = Nan::New<v8::Object>();
		Nan::SetPrototype(groups, Nan::Null());

		for (std::pair<std::string, int> group : namedGroups)
		{
			Nan::Set(groups, Nan::New(group.first).ToLocalChecked(), argv[group.second]);
		}

		argv.push_back(groups);
	}

	auto maybeResult = Nan::CallAsFunction(replacer->GetFunction(), context->Global(), static_cast<int>(argv.size()), &argv[0]);

	if (maybeResult.IsEmpty())
	{
		return Nan::Nothing<std::string>();
	}

	auto result = maybeResult.ToLocalChecked();

	auto bin = getBinaryData(result);
	if (bin.isBinary)
	{
		return Nan::Just(std::string(bin.data, bin.size));
	}

	auto t = result->ToString(Nan::GetCurrentContext());
	if (t.IsEmpty())
	{
		return Nan::Nothing<std::string>();
	}

	v8::String::Utf8Value s(v8::Isolate::GetCurrent(), t.ToLocalChecked());
	return Nan::Just(std::string(*s));
}

static bool replace(
	WrappedRE2 *re2,
	const StrVal &replacee,
	const Nan::Callback *replacer,
	const v8::Local<v8::Value> &input,
	bool useBuffers,
	std::string &result)
{
	const re2::StringPiece str = replacee;
	const char *data = str.data();
	size_t size = str.size();

	std::vector<re2::StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1);
	const auto &match = groups[0];

	SizeSink budget(replacee);
	const auto append = [&](const re2::StringPiece &piece)
	{
		budget.append(piece);
		if (!budget.isFull())
		{
			result.append(piece.data(), piece.size());
		}
	};
	const auto tooLong = []()
	{
		Nan::ThrowRangeError("Invalid string length");
		return false;
	};

	size_t byteIndex = 0;
	auto anchor = re2::RE2::UNANCHORED;

	if (re2->sticky)
	{
		if (!re2->global)
			byteIndex = replacee.byteIndex;
		anchor = RE2::ANCHOR_START;
	}

	if (byteIndex)
	{
		append(re2::StringPiece(data, byteIndex));
	}

	const auto &namedGroups = re2->regexp.NamedCapturingGroups();

	bool noMatch = true;
	while (byteIndex <= size && re2->regexp.Match(str, byteIndex, size, anchor, &groups[0], groups.size()))
	{
		noMatch = false;
		auto offset = match.data() - data;
		if (!re2->global && re2->sticky)
		{
			re2->lastIndex += replacee.isBuffer ? offset + match.size() - byteIndex : toUtf16Index(replacee.isAscii, data + byteIndex, match.data() + match.size());
		}
		if (match.data() == data || offset > static_cast<long>(byteIndex))
		{
			append(re2::StringPiece(data + byteIndex, offset - byteIndex));
		}
		const auto part = replace(replacer, groups, str, input, useBuffers, replacee.isAscii, namedGroups);
		if (part.IsNothing())
		{
			return false;
		}
		append(part.FromJust());
		if (budget.isFull())
		{
			return tooLong();
		}
		if (match.size())
		{
			byteIndex = offset + match.size();
		}
		else if ((size_t)offset < size)
		{
			auto sym_size = getUtf8CharSize(data[offset], size - (size_t)offset);
			append(re2::StringPiece(data + offset, sym_size));
			byteIndex = offset + sym_size;
		}
		else
		{
			byteIndex = size;
			break;
		}
		if (!re2->global)
		{
			break;
		}
	}
	if (byteIndex < size)
	{
		append(re2::StringPiece(data + byteIndex, size - byteIndex));
	}
	if (budget.isFull())
	{
		return tooLong();
	}

	if (re2->global)
	{
		re2->lastIndex = 0;
	}
	else if (re2->sticky)
	{
		if (noMatch)
		{
			re2->lastIndex = 0;
		}
	}

	return true;
}

static bool requiresBuffers(const v8::Local<v8::Function> &f)
{
	auto flag(Nan::Get(f, Nan::New("useBuffers").ToLocalChecked()).ToLocalChecked());
	if (flag->IsUndefined() || flag->IsNull() || flag->IsFalse())
	{
		return false;
	}
	if (flag->IsNumber())
	{
		return flag->NumberValue(Nan::GetCurrentContext()).FromMaybe(0) != 0;
	}
	if (flag->IsString())
	{
		return flag->ToString(Nan::GetCurrentContext()).ToLocalChecked()->Length() > 0;
	}
	return true;
}

NAN_METHOD(WrappedRE2::Replace)
{
	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2)
	{
		info.GetReturnValue().Set(info[0]);
		return;
	}

	PrepareLastString prep(re2, info[0]);
	StrVal& replacee = prep;
	if (replacee.isBad) return; // throws an exception

	if (!replacee.isValidIndex)
	{
		info.GetReturnValue().Set(info[0]);
		return;
	}

	std::string result;

	if (info[1]->IsFunction())
	{
		auto fun = info[1].As<v8::Function>();
		const std::unique_ptr<const Nan::Callback> cb(new Nan::Callback(fun));
		if (!replace(re2, replacee, cb.get(), info[0], requiresBuffers(fun), result))
		{
			info.GetReturnValue().Set(info[0]);
			return;
		}
	}
	else
	{
		const char *data;
		size_t size;

		auto bin = getBinaryData(info[1]);
		if (bin.isBinary)
		{
			data = bin.data;
			size = bin.size;
		}
		else
		{
			auto t = info[1]->ToString(Nan::GetCurrentContext());
			if (t.IsEmpty())
				return; // throws an exception
			auto replacer = node::Buffer::New(v8::Isolate::GetCurrent(), t.ToLocalChecked()).ToLocalChecked();
			data = node::Buffer::Data(replacer);
			size = node::Buffer::Length(replacer);
		}

		if (!replace(re2, replacee, data, size, result))
		{
			info.GetReturnValue().Set(info[0]);
			return;
		}
	}

	if (replacee.isBuffer)
	{
		auto buffer = Nan::CopyBuffer(result.data(), result.size());
		if (buffer.IsEmpty())
		{
			Nan::ThrowRangeError("Invalid string length");
			return;
		}
		info.GetReturnValue().Set(buffer.ToLocalChecked());
		return;
	}
	// over-max-length result -> empty MaybeLocal; ToLocalChecked() would abort()
	auto text = Nan::New(result);
	if (text.IsEmpty())
	{
		Nan::ThrowRangeError("Invalid string length");
		return;
	}
	info.GetReturnValue().Set(text.ToLocalChecked());
}
